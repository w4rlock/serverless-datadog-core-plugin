![serverless](http://public.serverless.com/badges/v3.svg)
[![npm
version](https://badge.fury.io/js/serverless-datadog-logfwd-plugin.svg)](https://badge.fury.io/js/serverless-datadog-logfwd-plugin)

## Installation
```bash
npm i -E serverless-datadog-logfwd-plugin
```

### Usage

```yaml
plugins:
  - serverless-datadog-logfwd-plugin

custom:
  datadogLogForward:
    disabled: ${env:DATADOG_DISABLED,'false'}
    apiKey: ${env:DATADOG_LF_APIKEY,''}         # use vault, ssm, etc

    functionName: ${self:service.name}-${self:custom.provider.stage}-datadog
    bucket: your_existent_s3_bucket_logs
    extendsFn:
      memorySize: 512
```

### Log Forward version 3.5.0
https://github.com/DataDog/datadog-serverless-functions/tree/master/aws/logs_monitoring
