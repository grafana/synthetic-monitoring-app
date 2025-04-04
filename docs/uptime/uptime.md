# About Uptime

"Is my website up?" is the most basic question that any website owner or operator needs to answer at any given time. During a time-sensitive incident, the answer to this question is essential for the next steps that need to be taken.

This makes it the single most important visualization that we provide in the Synthetic Monitoring application. It is crucial that it is as accurate as it can be so that users can feel confident in the data that they are seeing.

If uptime has any degree of inaccuracy, it can lead to a false sense of security or panic and frustration, which reduces confidence in our product and perceived value.

## Use cases

1. **"Is my site up right now?"** - Most daily use-cases of Synthetic Monitoring will be over smaller time ranges of a few hours. Our default is 3 hours but users might adjust the time range to 1 hour or 24 hours.
2. **"I have a fortnightly SLA to report"** - Reporting uptime metrics for weekly / bi-weekly / monthly SLAs or other business metrics at regularly occurring meetings. In this case, a moderate time period, such as a week or a month is a likely scenario.
3. **"Is our hosting provider reliable?"** - To assess whether more strategic decisions are warranted and to paint a holistic picture, it is equally valid to query much longer time periods, such as a quarter or even a year.
4. **"We had an incident. I need to know exactly what happened."** - a query of just a few minutes is very likely in the case of an incident that requires a deep level of analysis when problems began and ended so the root cause can be established.

When we consider all of these use cases, we have to cater for an accurate uptime metric for as little as a minute up to one year. This is a **huge** range of time periods and we need to be able to accurately calculate uptime for all of them.

## A simple calculation

We calculate uptime as the percentage of successful time points in the requested time range that return a positive result. A simple way to express uptime is as follows:

```
Uptime = (Successful Time Points / Reported Time Points) * 100
```

A time point is a collection of probes executing the same check at the same time. If a single probe returns a positive result, the time point is considered successful. If all probes return a 0 result, the time point is considered a failure.

Example calculation:
| Time | ProbeA | ProbeB | ProbeC | Uptime Result     |
|------|--------|--------|--------|-------------------|
| t1   | 1      | 1      | 1      | Success           |
| t2   | 0      | 0      | 0      | Failure           |
| t3   | 1      | 0      | 0      | Success           |
| t4   | 1      | 1      | 0      | Success           |

Uptime = (3 successful time points / 4 total time points) * 100 = 75%

## Understanding the underlying complexity

The above calculation is a naive way to calculate uptime and doesn't take into account the nuance and multi-layered architecture of how we run checks and store data. The two big variables that we need to consider are:

1. When does a time point start and end? How many probes reported a result for that time point?
    - In an ideal world, if you had a probe running a check every 15 seconds they would each report their results at precisely the interval time. e.g. 12:00:15, 12:00:30, 12:00:45. However, in reality, probes won't always report their results at the same time. One probe might report at 12:00:15 but the second probe might report at 12:00:16. It could be as late as 12:00:29 or even 12:00:30, which would now be considered a new time point. Time point 1 would only have two probe execution samples and time point 2 would have three (or possibly four...) probe execution samples.
2. How large is the time period we are querying and how often is the check executing? Consider the following tables in how extreme the execution number can vary depending on the time period, check frequency and number of probes.

| Time range | Check frequency | Number of probes | Executions  |
|------------|-----------------|------------------|-------------|
| 1 hour     | 1 minute        | 1                | 60          |
| 1 day      | 1 minute        | 1                | 1,440       |
| 1 week     | 1 minute        | 1                | 10,080      |
| 1 year     | 1 minute        | 1                | 524,160     |

| Time range | Check frequency | Number of probes | Executions  |
|------------|-----------------|------------------|-------------|
| 1 hour     | 1 minute        | 3                | 180         |
| 1 day      | 1 minute        | 3                | 4,320       |
| 1 week     | 1 minute        | 3                | 30,240      |
| 1 year     | 1 minute        | 3                | 1,572,480   |

| Time range | Check frequency | Number of probes | Executions  |
|------------|-----------------|------------------|-------------|
| 1 hour     | 15 seconds      | 20               | 4800        |
| 1 day      | 15 seconds      | 20               | 115,200     |
| 1 week     | 15 seconds      | 20               | 806,400     |
| 1 year     | 15 seconds      | 20               | 41,932,800  |

3. A check might have multiple configurations during the time period we are querying. This could be a change in frequency, the number of probes or the check's definition of uptime itself. This could lead to a change in the number of time points and the number of them which are successful.

4. It is not guaranteed that every check's results will end up in Mimir. The agent uses the HTTP remote write method and that is subject to the fickleness of the internet so some samples may be unintenionally dropped and go unreported. This is a comparatively small number but it is worth noting and will have a more magnifying effect at smaller time ranges.

## How we collect and query data

![](./images/sm-architecture.png)

[A more detailed explanation of the Synthetic Monitoring architecture in our on-call training. (Grafana Labs internal-only)](https://docs.google.com/presentation/d/1jWuv2VwVFIsdyXq4JQMlhmM6txHXLyHImYpnl50V5XQ/edit#slide=id.g308ff111cb5_0_35).

Our architecture is multi-layered with many separate services. Please read the material above for an in-depth guide to how we collect and publish data. The most relevant part when considering uptime is: **we have multiple probes (which are effectively SM Agents) that run checks at regular intervals and report metric results to a Grafana Cloud Mimir instance and publishes a check execution's logs to a Grafana Cloud Loki instance.**

Our agents report two time series metrics which are directly related to uptime:
1. `probe_success` is a [Prometheus gauge metric](https://prometheus.io/docs/concepts/metric_types/#gauge). It can only have a value of 0 or 1. 0 represents an execution failure and 1 represents an execution success.
2. `probe_all_success` is a [Prometheus summary metric](https://prometheus.io/docs/concepts/metric_types/#summary). A summary metric is made up two separate observations, in this case:
    - `probe_all_success_sum`: the sum of all __successful__ executions
    - `probe_all_success_count`: the count of all executions

Within the Synthetic Monitoring App we query the instance's default Cloud Mimir datasource using PromQL to calculate uptime.

## How we calculate uptime with PromQL

Taking into account all of the above, our uptime calculation is the following:

Utilizing Mimir's `range_query` endpoint the expression is:

```
max by () (max_over_time(probe_success{job="$job", instance="$instance"}[$frequencyInSeconds]))
```

With an `interval` (also known as `minStep` or `step`) parameter set to the check's `$frequencyInSeconds`. This parameter establishes a time point.

Additionally, the range from the Grafana time picker and where appropriate we might set a `maxDataPoints` parameter to be as high as possible (8000 or so has proven effective) to increase the fidelity of the data when looking at large time periods.

To explain the individual parts of the query expression, starting from the innermost part:

### probe_success{job="$job", instance="$instance"}

`probe_success` is a [Prometheus gauge metric](https://prometheus.io/docs/concepts/metric_types/#gauge) reported by each of our probes. It can only have a value of 0 or 1, representing failure and success. We add `job` and `instance` label filters as these two combined are how we uniquely identify a check. `probe` and `config_version` labels are also available on this metric but are not explicitly used in the uptime calculation. It is worth noting they exist on the metric for two reasons:
1. we want to collect all the probe samples, so don't want to discriminate against any of them.
2. if we modify the base query we can end up with very different results depending on the scenario because of the `config_version` _[See the example below](#what-happens-if-we-remove-the-max_over_time-aggregation-from-the-query)_.

### max_over_time({{_metric_}}[$frequencyInSeconds])

`max_over_time` is a [Prometheus aggregation function](https://prometheus.io/docs/prometheus/latest/querying/functions/#aggregation_over_time) that returns the maximum value of a metric over a given time range, in this case a check's frequency in seconds: `$frequencyInSeconds`. This range-vector shares the same value with the interval parameter to ensure that only the executions reported in its time point are evaluated and can't be influenced by the previous or following time points. The range-vector is often referred to as the 'look-back time' or 'evaluation period'.

For example, if the check is running every 15 seconds, the range-vector would be 15 seconds. If the check is running every minute, the range-vector would be 60 seconds.

This function gives us two benefits, one explicit and one implicit:

1. __explicit__: we are telling Prometheus what range-vector to use so what we consider a time point. Essentially, 'evaluate the entire time range in blocks of `$frequencyInSeconds` and return the max value for each block (e.g. 1 if it is successful). This allows the probes to report their results at any time during the start and end of the time point but be considered a single point in time.
2. __implicit__: this removes Prometheus' assumed continuity of metrics (the value for the `--query.lookback-delta` which is provided [as a flag when the server is set-up](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/#flags)). If we didn't use this function, Prometheus would assume that the metric is continuous and that there are no gaps in the data for 5 minutes after it stops reporting. This is not the case and often acts as a bad assumption leading to inaccurate results. _[See the example below](#what-happens-if-we-remove-the-max_over_time-aggregation-from-the-query)_

### max by() (...)

Each assessment of uptime for a time point is a binary result: it is either 1 (success) or 0 (failure). In the previous step we gathered all of the unique samples for a given time point (usually by probe, but could also include differing configurations when the check is updated) and in this step we pick out the max value and discard the rest. We only care if a time point has a single success. If a time point has 3 successful samples, we still only want to count it as 1 successful time point (individual successes are represented by our reachability metric).

## Known limitations

![Uptime v3](./images/how-it-works-visualised.png)

The main limitation of our uptime query is an absense of data. There are multiple reasons why we might not have data for a given time point:
- The probe cluster restarted
- The agent(s) restarted
- Mimir rejected the sample because of hitting an ingestion limit
- The agent(s) were unable to reach Mimir to write the result
- General fickleness of the internet

Consider the scenario above, we have a check that is running every minute with three probes. We want to know uptime for the last five minutes.

1. For the first time point we have three successes reported
2. For the second we only have the result for a single probe because of the write-blocking event.
3. By the time the write-blocking event subsides, the third time point is about to expire - there is not enough time for the probe executions to start, run and report their results, so they resume and get reported in the fourth time point.
4. The fourth time point has two successes and a failure
5. The fifth time point has three failures.

In this case we report a 75% uptime as we can only report on the data that is present, however it is likely the 'real' value is 80% if the third time point had been reported (4 successes / 5 time points).

### A note on dropped samples

Depending on the write-blocking event the data isn't _necessarily_ lost. If the agent was still running, it keeps a continuous record of the probe results which is represented by the summary metric. Depending on the results recorded and how many samples were dropped the result _might_ be able to be inferred by looking at the summary metric.

| Time | probe_all_success_count | probe_all_success_sum | Inferred result |
|------|------------------------ |-----------------------|---------------- |
| t1   | 1                       | 1                     | Up              |
| t2   | -                       | -                     | Up              |
| t3   | -                       | -                     | Up              |
| t4   | 4                       | 4                     | Up              |

Despite we have no data for the second and third time points, we can infer both results were successful because the `probe_all_success_sum` is 4 and the `probe_all_success_count` is 4, indicating no failures were reported.

| Time | probe_all_success_count | probe_all_success_sum | Inferred result |
|------|------------------------ |-----------------------|---------------- |
| t1   | 1                       | 1                     | Up              |
| t2   | -                       | -                     | ?               |
| t3   | -                       | -                     | ?               |
| t4   | 4                       | 3                     | Up              |

However, in updated scenario above we know that only one of t2 or t3 were successful but we can't know which one. If the check was running a single probe we could say with confidence that the uptime was 75% but with multiple probes we can't be sure, as we can't confirm if they had the same results if their successes and failures were at the same time.

Despite the summary metric providing this slight advantage over just utilising `probe_success`, it isn't enough to justify its use for our uptime calculation.

## Visualising uptime

When we visualize uptime, we need to consider how we present the data to the user. We have two main ways of visualizing uptime:

**Single stat panel**: It is a single number that represents the uptime percentage for the given time range. It is the most straightforward way to present the data but it doesn't give the user any insight into how that number was derived.

When displaying uptime as a single stat there are two important aspects to note:
  1. we set the `maxDataPoints` option as high as possible to increase its fidelity for large time ranges. _[Could it be an instant query instead?](#why-do-we-use-range-queries-instead-of-instant-queries-for-generating-a-single-uptime-metric)_
  2. We perform a client-side Grafana transformation to reduce each datapoint to a single value, it is essentially: `count successes / count total data points * 100` so it is viualised as a percentage.

**Graph**: It shows the underlying data that contributes to calculating the uptime percentage and correlates with the mental model of how Synthetic Monitoring operates: a plot point = a Synthetic Monitoring check.

It gives the user an in-depth view of how their checks were performing at any given time. We do no transformations on the data and it is presented as-is in a Grafana graph panel.

## Testing strategy

We have a library where we can create a base set of Prometheus metrics across different common scenarios. This allows us to test our PromQL queries where we know precisely what the expected result should be as we have access to the underlying data used to populate the database.

A core problem with datasets in Prometheus is you can only use PromQL to extract it. This means the only way to validate if our PromQL queries are correct is by writing more PromQL... (_a snake eating its own tail comes to mind_).

When we know beforehand what the data is we've provided to Prometheus, we can validate the result using other means which aren't PromQL. We can now continually modify our PromQL queries with a goal in mind to see how it behaves in different scenarios and across different time periods and evaluate the results and assess what is best suited for our needs.

There are two base-level assumptions each of the following scenarios has been run through:

1. **The control group (in-phase)**: Every probe reports its result at exactly the check interval time (e.g. 12:00:15, 12:00:30, 12:00:45)
    - This is to simulate the ideal scenario where probes report their results at the same time and where we 'know' what the expected result should be to compare against.
2. **The real-world group (out-of-phase)**: Every entry has a 1% chance to 'jitter' and delay its reporting by up to 33% of the check's frequency time, which knocks onto the following time point.
    - This is to _somewhat_ simulate the real-world scenario where probes don't report their results at the same time. It makes evaluation of what the expected result should be more difficult but using the control group as a comparison we can see how the query behaves in a more realistic scenario.

There are four time periods that we have tested our uptime query against:

1. __10 minutes__ / 15-second frequency
2. __3 hours__ / 15-second frequency
3. __6 months__ / 1-minute frequency
4. __1 year__ / 1-minute frequency

Against each of these time periods we have tested the following scenarios:

### Testing scenarios

_The following examples are all taken from the control group, showing 'in-phase' results over a 10-minute time period._

#### 1p_overlap
![](./images/control_1p_overlap.png)

Our simplest scenario: a single probe with 10% of failures at the end of the time period. The query correctly calculates 90% uptime.

#### 1p_random
![](./images/control_1p_random.png)

A single probe with 10% of failures randomly distributed throughout the time period. The query correctly calculates 90% uptime.

#### 1p_overlap_4c

![](./images/control_1p_overlap_4c.png)

A single probe with 10% of failures at the end of the time period, the probe had 4 config_versions of equal length during the time period but all failures occurred in the last config_version. The query correctly calculates 90% uptime.

#### 2p_overlap
![](./images/control_2p_overlap.png)

Two probes with a 10% failure rate at the end of the time period. The query correctly calculates 90% uptime.

#### 2p_no_overlap
![](./images/control_2p_no_overlap.png)

Two probes each with a 10% failure rate. probe1 has its failures at the end of the time period, probe2 has its failures at the beginning so they never overlap. The query correctly calculates 100% uptime.

#### 2p_random
![](./images/control_2p_random.png)

Two probes each with a 10% failure rate. Each probe has its own random failures throughout the time period which may or may not overlap. In the example above, none of the failures overlap so the query correctly calculates 100% uptime.

#### 2p_shared_random
![](./images/control_2p_shared_random.png)

Two probes with a 10% failure rate. The failures are shared at random points of time for each probe. The query correctly calculates 90% uptime.

#### 20p_random
![](./images/control_20p_random.png)

20 probes with a 50% failure rate. Each probe has its own random failures throughout the time period. In the example above, none of the failures overlap so the query correctly calculates 100% uptime (it is possible but very unlikely for all 20 probes to fail at the same time point when the failures for each probe are random).

#### 20p_shared_random
![](./images/control_20p_shared_random.png)

20 probes with a 50% failure rate. The failures are shared at random points of time for each probe. The query correctly calculates 50% uptime.

`shared_random` is to simulate the scenario where the issue lies at the endpoint on the client's side; `random` is to simulate the scenario where the issue lies with the probe itself.

### Results

Every scenario has been evaluated three times to ensure the randomness of the entry data has been taken into account. The three results are then averaged to give a final result of accuracy.

This means the uptime query has been assessed **240** times in total: 2 base assumptions * 4 time ranges * 10 scenarios * 3 randomness offset. Collectively these tests generated over 1 billion metrics.

#### Accuracy in the control group.

| Scenario          | 10m    | 3h     | 6M     | 1y     |
|-------------------|--------|--------|--------| ------ |
| 1p_overlap        | 100%   | 100%   | 100%   | 100%   |
| 1p_random         | 100%   | 100%   | 99.83% | 99.85% |
| 1p_overlap_4c     | 100%   | 100%   | 100%   | 100%   |
| 2p_overlap        | 100%   | 100%   | 100%   | 100%   |
| 2p_no_overlap     | 100%   | 100%   | 100%   | 100%   |
| 2p_overlap_4c     | 100%   | 100%   | 100%   | 100%   |
| 2p_random         | 99.9%  | 99.48% | 99.67% | 99.77% |
| 2p_shared_random  | 100%   | 100%   | 99.7%  | 99.6%  |
| 20p_random        | 100%   | 100%   | 100%   | 99.96% |
| 20p_shared_random | 100%   | 100%   | 99.42% | 99.34% |

#### 'Accuracy' in the jitter group.

_This is a more difficult metric to measure and interpret as the expected result is not precisely known but from extrapolation of the control group, and what we know a jitter is likely to do we can see how the query behaves with more realistic real-life data._

| Scenario          | 10m     | 3h      | 6M      | 1y      |
|-------------------|---------|---------|---------| ------- |
| 1p_overlap        | ~100%   | ~99.96% | ~99.96% | ~99.99% |
| 1p_random         | ~99.91% | ~99.99% | ~99.63% | ~99.87% |
| 1p_overlap_4c     | ~99.14% | ~99.99% | ~99.99% | ~99.99% |
| 2p_overlap        | ~99.16% | ~99.95% | ~99.99  | ~100%   |
| 2p_no_overlap     | ~100%   | ~99.95% | ~99.98% | ~99.99% |
| 2p_overlap_4c     | ~100%   | ~99.95% | ~100%   | ~99.99% |
| 2p_random         | ~99.16% | ~99.03% | ~98.65% | ~98.66% |
| 2p_shared_random  | ~100%   | ~97.13% | ~91.7%  | ~91.99% |
| 20p_random        | ~100%   | ~91.62% | ~100%   | ~100%   |
| 20p_shared_random | ~99%    | ~99%    | ~100%   | ~100%   |

#### Explaining the results:

In the control group, if we inspect the underlying data for the 20_shared_random results with a 50% failure rate, we can see when the failures occur. Every time point has all 20 probes either successfully passing or failing.

![](./images/in_phase_probes.png)
__In phase probes__. A graph showing 40 time points, 20 of which are successful and 20 of which are failures. The failures are all at the same time point.

When reduced in the stat panel, this shows a 50% uptime.

![](./images/out_of_phase_probes.png)
__Out of phase probes__. A graph showing 40 time points, 30 of which have a successful result and 10 of which are failures. This is the more 'realistic' scenario with real world reporting because of the interaction between how agents start/restart and also how agents communicate with k6-runners for k6-powered checks. It is very likely for the probes to begin running the checks at different times ('out-of-phase') and increasingly become out of sync with 'jitters'. Frankly, this is a feature rather than a bug as it ensures monitoring coverage is more comprehensive and a client's endpoints aren't receiving a barrage of requests at exactly the same time.

When reduced in the stat panel, this shows a 75% uptime -- which from the point of view of measuring uptime is correct. Across the 40 time points, 30 are successful and 10 are failures despite the heavy-skewing of certain time points reporting multiple successes versus some only reporting one or two successes. Because our testing strategy deliberately introduces this random aspect to it, it is impossible to accurately predict what the expected result should be (without evaluating the data in minute detail) but we are confident that the query is behaving as expected.

##### How is the uptime query over a year period so accurate?

![](./images/20p_accuracy.png)

Uptime v3 showing 49.7% uptime for the `20p_shared_random` scenario. The underlying data has a 50% uptime so the result is only off by 0.3%, which is very impressive for a single query quickly evaluating 10,500,000 individual data points (525,000 minutes in a year x 20 probe samples).

Honestly, no idea - Prometheus Black magic is the only answer I can provide. I have gone over the whole testing process from start to finish with a fine tooth comb to understand if there is any fault in the underlying data that is generated, the backfill process and uploading to Prometheus but it is all correct.

![](./images/logs_vs_visualization.png)

The above image demonstrates visualizing a 10-minute period that is approximately 11 months into the past of the dataset and cross-referencing the raw data that was generated that is inserted into Prometheus. Uptime v3 is precisely correct in its calculation, Uptime calculations V1 and V2 are both incorrect.

11 data points: 3 successes, 8 failures. (3/11 * 100) = 27.3% uptime (rounded).

##### Can I view the raw results that were used in the testing process?

Yes. They are saved in our 'Synthetics Dashboards reference' Google Sheet in the tabs ['In-phase Testing scenarios' _Grafana internal-only_](https://docs.google.com/spreadsheets/d/1-Rc2vti-LoKqM9Z-GureUXKwmbc1AJ1B8GvHx5pJrDA/edit?gid=192150256#gid=192150256) and ['Out-of-phase Testing scenarios' _Grafana internal-only_](https://docs.google.com/spreadsheets/d/1-Rc2vti-LoKqM9Z-GureUXKwmbc1AJ1B8GvHx5pJrDA/edit?gid=843281165#gid=843281165).

## FAQ

### Why do we use range queries instead of instant queries for generating a single uptime metric?

The answer to this is multi-faceted. It boils down to:

1. Mimir limitations

A limitation we bypass using range queries is Mimir's 768-hour (32 days) time range limit for instant queries, meaning we can support the long-range use cases outlined at the top of this document. The only way to evaluate uptime for a period longer than 768 hours is using a range query.

2. Consistency

Because of the above limitation it is easier to use range queries for all use cases. In the future we may revisit this and change the query depending on the selected time period. It also means that when utilizing the 'Explore' option in the uptime stat panel the user can see the same data as they would in the graph panel and can infer how it is reduced to a single number.

### What happens if we remove the `max_over_time` aggregation from the query?

Prometheus has a feature where it has 'assumed continuity' of metrics. The continuinity time is provided by the value for the feature flag `--query.lookback-delta` which is set [when the server is set-up](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/#flags). This means that if a metric is not reported for a given time point, Prometheus will assume that the metric is the same as the previous time point for the length of time as decided by the feature flag before it stops reporting. For Synthetic Monitoring, this is a bad assumption to make and can have a detrimental effect on the accuracy of our uptime calculation.

A likely scenario for collecting false positives would be down to user error when updating uptime definitions. Even if the newly configured check immediately starts reporting errors, they would be masked for five minutes because the previous `config_version` would be reporting its last known value (likely to be success) for the following five minutes.

![](./images/without_aggregation.png)

In the example above, on the left is the query `max by(config) (probe_success{job="$job", instance="$instance"})` versus `max by(config) (max_over_time(probe_success{job="$job", instance="$instance"}[$frequencyInSeconds]))` on the right. We can see every time point is considered successful in the left graph because of the assumed continuity of metrics and how `probe_success` results now overlap, even though it is impossible in our architecture. 'Turning off' continuity of metrics is a must for our uptime calculation.

### Do we take into account a change of frequency across the selected time period in our uptime calculation?

No. This is currently a problem that we need to do a more thorough investigation into how to solve.

### Why don't we use the `probe_all_success` summary metrics?

Previously with the previous 2 versions we have explored for uptime we had been using the `probe_all_success` summary metric to calculate uptime.

![](./images/versions_comparison.png)

The image above shows a comparison of the three queries visualised as time series and reduced to a single stat panel for our simplest scenario `10m_1p_overlap`.

Exploring the limitations when using the summary metric:

1. Notice that the first data point is missing for V2 and V3 queries in their graph visualisations -- summary metrics work by looking at previous values so when it is the first in a series they can't infer their value so display nothing at all. This is the first reason why the single stat panel is displayed incorrectly, in this scenario it is using only 39 data points to calculate uptime from instead of 40.
    - _This is a relatively minor limitation as it only applies to the very start when a check is first created but it is worth noting as there is a noticable delay when waiting for results to come in._

2. Both V1 and V2 versions report the decrease in uptime at a later time point than the underlying data shows. V1 reports uptime 2 data points late and V2 reports it 1 data point late. If we explore in detail why this occurs:

![](./images/versions_comparison_detail.png)

The above image shows the individual parts of the query broken down and visualised for each time point. For the first time point where uptime has decreased, the increase value for `probe_all_success_sum` is reported as 2.67:
- It calculates this by looking at the previous 1 minute of data (`$__rate_interval` = 15s (`$__interval`) x 4 (default best practice)) and observing the increase in the first to present samples. It should be precisely 2 in this case but [Prometheus extrapolates](https://prometheus.io/docs/prometheus/latest/querying/functions/#increase) the time range either side slightly so we end up with 2.67.
- As the increase for `probe_all_success_count` is 4, the calculation is 2.67 / 4 * 100 = 0.667, the last step is rounding this to the closest integer, which is 1 which indicates success which is incorrect.
- For the following step the increase is halved to 1.333, the increase for `probe_all_success_count` is still 4 so the calculation is 1.333 / 4 * 100 = 0.33, rounded this comes to 0 indicating failure, which is correct.
    - V1 does something similar but during the outermost `ceil` evaluation in the query it rounds this value up to 1 (thus meaning a success) for _any_ value that isn't 0 when evaluating the result of the inner evaluation so it will only report a decrease in uptime once it has at least 3 failures in a row.

In the case of V2, this 'off by one' reporting might be considered comparatively minor for this scenario where failures all appear in a row but if we look at a different scenario and apply the v2 query, it becomes more apparent how this level of inaccuracy can have a detrimental effect on the uptime indicator.

![](./images/versions_comparison_hidden_failures.png)

In the above image, V2 ignores failures that happen as one-off events - if every third result was a failure they would all be hidden and we could be over-reporting uptime by 33.33%.

It is worth noting, the only way to fix this is by changing the range-vector from `$__rate_interval` to a value that only evaluates the current sample to its preceeding one but this essentially makes the query the same as the V3 query (and it often fails to produce results for longer time-ranges).
