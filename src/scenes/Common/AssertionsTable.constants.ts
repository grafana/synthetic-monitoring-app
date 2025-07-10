export const QUERY_SUCCESS_RATE = `
  count_over_time (
    {job="$job", instance="$instance", probe=~"$probe"}
    | logfmt check, value, msg
    | __error__ = ""
    | msg = "check result"
    | value = "1"
    | keep check
    [$__range]
  )
  /
  count_over_time (
      {job="$job", instance="$instance", probe=~"$probe"}
      | logfmt check, msg
      | __error__ = ""
      | msg = "check result"
      | keep check
      [$__range]
    )
`;

export const QUERY_SUCCESS_COUNT = `
  count_over_time (
    {job="$job", instance="$instance", probe=~"$probe"}
    | logfmt check, value, msg
    | __error__ = ""
    | msg = "check result"
    | value = "1"
    | keep check
    [$__range]
  )
`;

export const QUERY_FAILURE_COUNT = `
  count_over_time (
    {job="$job", instance="$instance", probe=~"$probe"}
    | logfmt check, value, msg
    | __error__ = ""
    | msg = "check result"
    | value != "1"
    | keep check
    [$__range]
  )
`;
