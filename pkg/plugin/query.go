package plugin

import (
	"context"
	"maps"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// queryGroup is the unit of batching: one /api/ds/query round trip serves every
// query sharing both a backing datasource and a time range. Grouping by
// datasource alone would be wrong -- /api/ds/query takes one from/to for the
// whole request, so two queries against the same datasource but different time
// ranges (a panel comparing two windows, say) would silently apply one query's
// range to the other's data.
type queryGroup struct {
	ds       linkedDatasource
	fromUnix int64
	toUnix   int64
}

// QueryData resolves each named query and forwards it to the datasource that
// holds the data.
//
// Queries are grouped by backing datasource and time range so that a request
// mixing metrics and logs, or several queries sharing both, costs one round
// trip per group rather than one per query.
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	groups := d.groupQueries(req.Queries, response)
	d.runGroups(ctx, req.PluginContext.User, groups, response)

	return response, nil
}

// groupQueries resolves every named query in the request and buckets it by
// queryGroup, so that queries sharing both a datasource and a time range are
// later answered by a single /api/ds/query round trip. A query that fails to
// resolve or targets an unconfigured datasource is recorded directly into
// response and left out of the returned groups.
func (d *Datasource) groupQueries(queries []backend.DataQuery, response *backend.QueryDataResponse) map[queryGroup][]dsQuery {
	groups := map[queryGroup][]dsQuery{}

	for _, q := range queries {
		nq, b, err := resolve(q.QueryType, q.JSON)
		if err != nil {
			response.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, err.Error())
			continue
		}

		ds, err := d.targetFor(nq.target)
		if err != nil {
			response.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, err.Error())
			continue
		}

		log.DefaultLogger.Debug("resolved named query",
			"name", q.QueryType, "refId", q.RefID, "target", nq.target, "datasource", ds.UID, "expr", b.expr)

		key := queryGroup{ds: ds, fromUnix: q.TimeRange.From.UnixNano(), toUnix: q.TimeRange.To.UnixNano()}
		groups[key] = append(groups[key], dsQuery{
			RefID:         q.RefID,
			Expr:          b.expr,
			Datasource:    ds,
			Range:         !b.instant,
			Instant:       b.instant,
			Interval:      b.interval,
			IntervalMs:    q.Interval.Milliseconds(),
			MaxDataPoints: maxDataPoints(b, q),
		})
	}

	return groups
}

// runGroups authorizes and executes each query group, writing results or
// errors into response. A group's authorization depends only on its
// datasource, not its time range, so groups sharing a datasource share one
// permission check.
func (d *Datasource) runGroups(ctx context.Context, user *backend.User, groups map[queryGroup][]dsQuery, response *backend.QueryDataResponse) {
	url := appURL(ctx)
	token := pluginToken(ctx)
	authDecisions := map[linkedDatasource]error{}

	for group, queries := range groups {
		authErr, checked := authDecisions[group.ds]
		if !checked {
			// The user, not the plugin, has to be entitled to this data.
			authErr = d.authorizer.authorize(ctx, url, token, user, group.ds)
			authDecisions[group.ds] = authErr
		}

		if authErr != nil {
			log.DefaultLogger.Warn("denying query", "datasource", group.ds.UID, "error", authErr)
			recordGroupError(response, queries, backend.StatusForbidden, authErr)

			continue
		}

		from := time.Unix(0, group.fromUnix)
		to := time.Unix(0, group.toUnix)

		result, err := d.grafana.query(ctx, url, token, from, to, queries)
		if err != nil {
			// the whole group failed; report it against each of its queries
			recordGroupError(response, queries, backend.StatusInternal, err)
			continue
		}

		maps.Copy(response.Responses, result.Responses)
	}
}

// recordGroupError marks every query in a group with the same status and
// error -- a group either fully succeeds or fully fails together, since it is
// answered by one /api/ds/query call.
func recordGroupError(response *backend.QueryDataResponse, queries []dsQuery, status backend.Status, err error) {
	for _, q := range queries {
		response.Responses[q.RefID] = backend.ErrDataResponse(status, err.Error())
	}
}

// maxDataPoints prefers what the named query asked for, falling back to what the
// frontend requested.
func maxDataPoints(b built, q backend.DataQuery) int64 {
	if b.maxDataPoints > 0 {
		return b.maxDataPoints
	}

	return q.MaxDataPoints
}
