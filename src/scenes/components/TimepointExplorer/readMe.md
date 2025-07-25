# Timepoint Explorer

Important:

An execution belongs to a timepoint based on its starting time. NOT its finished time.

This means an execution might end in the following timepoint.


## Architectural choices

There are several persisted queries within the TimepointExplorer. Their performance could be improved but for now they do the job. The problem we have is we add the timerange start and end values to the query key. This means that if the timerange changes (such as when the refresh picker state is enabled), the query will be refetched -- which is correct -- but its data will be lost, causing the visualisation to disappear.

Using the persisted queries means we retain the existing data and only update the data when the query is refetched.

## Timepoint and visualisation order

Timepoints are ordered from the end to the beginning.

The UI is essentially built RTL. Everything on the right is considered the beginning or at index 0. Everything on the left is considered the end or at the last index.

Timepoints:

|---|---|---|---|---|---|---|---|
| 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| 7 days ago | 6 days ago | 5 days ago | 4 days ago | 3 days ago | 2 days ago | 1 day ago | Today |





