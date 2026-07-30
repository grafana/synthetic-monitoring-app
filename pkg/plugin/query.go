package plugin

import (
	"context"
	"maps"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// QueryData resolves each named query and forwards it to the datasource that
// holds the data.
//
// Queries are grouped by backing datasource so that a request mixing metrics and
// logs costs one round trip per datasource rather than one per query.
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	byTarget := map[linkedDatasource][]dsQuery{}
	// the time range is per-query in the SDK but shared in /api/ds/query, so
	// remember which range each group was built from
	ranges := map[linkedDatasource]backend.TimeRange{}

	for _, q := range req.Queries {
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

		byTarget[ds] = append(byTarget[ds], dsQuery{
			RefID:         q.RefID,
			Expr:          b.expr,
			Datasource:    ds,
			Range:         !b.instant,
			Instant:       b.instant,
			Interval:      b.interval,
			IntervalMs:    q.Interval.Milliseconds(),
			MaxDataPoints: maxDataPoints(b, q),
		})
		ranges[ds] = q.TimeRange
	}

	url := appURL(ctx)
	token := pluginToken(ctx)

	for ds, queries := range byTarget {
		tr := ranges[ds]

		result, err := d.grafana.query(ctx, url, token, tr.From, tr.To, queries)
		if err != nil {
			// the whole group failed; report it against each of its queries
			for _, q := range queries {
				response.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusInternal, err.Error())
			}
			continue
		}

		maps.Copy(response.Responses, result.Responses)
	}

	return response, nil
}

// maxDataPoints prefers what the named query asked for, falling back to what the
// frontend requested.
func maxDataPoints(b built, q backend.DataQuery) int64 {
	if b.maxDataPoints > 0 {
		return b.maxDataPoints
	}

	return q.MaxDataPoints
}

// CheckHealth reports whether the backing datasources are configured. It does
// not query them -- a tenant with no data yet is healthy.
func (d *Datasource) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var missing []string

	if d.settings.Metrics.UID == "" {
		missing = append(missing, "metrics")
	}
	if d.settings.Logs.UID == "" {
		missing = append(missing, "logs")
	}

	if len(missing) > 0 {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "no " + strings.Join(missing, " or ") + " datasource configured",
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Synthetic Monitoring backend ready",
	}, nil
}
