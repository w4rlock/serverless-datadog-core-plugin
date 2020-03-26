---
functions:
  DatadogLogForward:
    name: {{functionName}}
    description: 'Datadog Log forward 3.5.0'
    runtime: python3.7
    handler: datadog_log_forward.datadog_forwarder
    package:
      # injected value at runtime
      artifact: ''
      individually: true
    layers:
      - arn:aws:lambda:us-east-1:464622532012:layer:Datadog-Python37:11
    environment:
      DD_API_KEY: {{apiKey}}
    # this tag is a plugin config
    iamRoleStatements:
      - Effect: 'Allow'
        Action:
          - s3:getObject
        Resource: arn:aws:s3:::{{bucket}}/*
    events:
      - s3:
          bucket: {{bucket}}
          existing: true
          event: s3:ObjectCreated:*
          rules:
            - prefix: Access/
            - suffix: .gz

