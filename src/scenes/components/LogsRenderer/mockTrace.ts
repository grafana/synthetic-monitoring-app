// @ts-nocheck
import { Trace } from 'scenes/components/LogsRenderer/TraceAndSpans.types';

export const trace: Trace = {
  services: [
    {
      name: 'faro-shop-backend',
      numberOfSpans: 8,
    },
  ],
  spans: [
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: 'dffd8116bcaa2b2d',
      parentSpanID: '',
      operationName: 'GET product_detail',
      serviceName: 'faro-shop-backend',
      kind: 'server',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.symfony',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815001089,
      duration: 1217414.066,
      logs: [],
      references: [],
      tags: [
        {
          value: '/srv/app/vendor/symfony/http-kernel/HttpKernel.php',
          key: 'code.filepath',
        },
        {
          value: 'handle',
          key: 'code.function',
        },
        {
          value: 69,
          key: 'code.lineno',
        },
        {
          value: 'Symfony\\Component\\HttpKernel\\HttpKernel',
          key: 'code.namespace',
        },
        {
          value: 'Japan',
          key: 'geo.country',
        },
        {
          value: '0',
          key: 'http.request.body.size',
        },
        {
          value: 'GET',
          key: 'http.request.method',
        },
        {
          value: 4566,
          key: 'http.response.body.size',
        },
        {
          value: 200,
          key: 'http.response.status_code',
        },
        {
          value: 'product_detail',
          key: 'http.route',
        },
        {
          value: '1.1',
          key: 'network.protocol.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'server.address',
        },
        {
          value: 80,
          key: 'server.port',
        },
        {
          value: 'http://faro-shop-backend/product/29',
          key: 'url.full',
        },
        {
          value: '/product/29',
          key: 'url.path',
        },
        {
          value: 'http',
          key: 'url.scheme',
        },
        {
          value:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
          key: 'user_agent.original',
        },
      ],
      processID: 'dffd8116bcaa2b2d',
      flags: 0,
      dataFrameRowIndex: 0,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 0,
      depth: 0,
      hasChildren: true,
      childSpanCount: 2,
      warnings: [],
      childSpanIds: ['b435eb8971d239bf', '3d3d9e9928130b83'],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: '3d3d9e9928130b83',
      parentSpanID: 'dffd8116bcaa2b2d',
      operationName: 'App\\Repository\\ProductRepository::find',
      serviceName: 'faro-shop-backend',
      kind: 'internal',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815010807.2,
      duration: 101549.29,
      logs: [],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: 'dffd8116bcaa2b2d',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
        },
      ],
      tags: [],
      processID: '3d3d9e9928130b83',
      flags: 0,
      dataFrameRowIndex: 1,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 9718.25,
      depth: 1,
      hasChildren: true,
      childSpanCount: 1,
      warnings: [],
      childSpanIds: ['57c1c8e91dfc1159'],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: '57c1c8e91dfc1159',
      parentSpanID: '3d3d9e9928130b83',
      operationName: 'Doctrine\\ORM\\EntityRepository::find',
      serviceName: 'faro-shop-backend',
      kind: 'internal',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815010865.8,
      duration: 101472.289,
      logs: [],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: '3d3d9e9928130b83',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
          span: {
            traceID: '02ba116e8d4eb3edce2b884e8660f183',
            spanID: '3d3d9e9928130b83',
            parentSpanID: 'dffd8116bcaa2b2d',
            operationName: 'App\\Repository\\ProductRepository::find',
            serviceName: 'faro-shop-backend',
            kind: 'internal',
            statusCode: 0,
            statusMessage: '',
            instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
            instrumentationLibraryVersion: '',
            traceState: '',
            startTime: 1750238815010807.2,
            duration: 101549.29,
            processID: '3d3d9e9928130b83',
            flags: 0,
            dataFrameRowIndex: 1,
            relativeStartTime: 9718.25,
            depth: 1,
            hasChildren: true,
            childSpanCount: 1,
          },
        },
      ],
      tags: [],
      processID: '57c1c8e91dfc1159',
      flags: 0,
      dataFrameRowIndex: 2,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 9776.75,
      depth: 2,
      hasChildren: true,
      childSpanCount: 3,
      warnings: [],
      childSpanIds: ['93a9749d5ed5f505', '51744411b1130724', '24cd9fa750b792fc'],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: '24cd9fa750b792fc',
      parentSpanID: '57c1c8e91dfc1159',
      operationName: 'PDO::exec',
      serviceName: 'faro-shop-backend',
      kind: 'client',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.pdo',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815091157.5,
      duration: 7521.738,
      logs: [],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: '57c1c8e91dfc1159',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
          span: {
            traceID: '02ba116e8d4eb3edce2b884e8660f183',
            spanID: '57c1c8e91dfc1159',
            parentSpanID: '3d3d9e9928130b83',
            operationName: 'Doctrine\\ORM\\EntityRepository::find',
            serviceName: 'faro-shop-backend',
            kind: 'internal',
            statusCode: 0,
            statusMessage: '',
            instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
            instrumentationLibraryVersion: '',
            traceState: '',
            startTime: 1750238815010865.8,
            duration: 101472.289,
            processID: '57c1c8e91dfc1159',
            flags: 0,
            dataFrameRowIndex: 2,
            relativeStartTime: 9776.75,
            depth: 2,
            hasChildren: true,
            childSpanCount: 3,
          },
        },
      ],
      tags: [
        {
          value: 'exec',
          key: 'code.function',
        },
        {
          value: 'PDO',
          key: 'code.namespace',
        },
        {
          value: "SET NAMES 'utf8'",
          key: 'db.statement',
        },
      ],
      processID: '24cd9fa750b792fc',
      flags: 0,
      dataFrameRowIndex: 4,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 90068.5,
      depth: 3,
      hasChildren: false,
      childSpanCount: 0,
      warnings: [],
      childSpanIds: [],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: '51744411b1130724',
      parentSpanID: '57c1c8e91dfc1159',
      operationName: 'PDO::prepare',
      serviceName: 'faro-shop-backend',
      kind: 'client',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.pdo',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815100177.5,
      duration: 1191.336,
      logs: [],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: '57c1c8e91dfc1159',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
        },
      ],
      tags: [
        {
          value: 'prepare',
          key: 'code.function',
        },
        {
          value: 'PDO',
          key: 'code.namespace',
        },
        {
          value:
            'SELECT t0.id AS id_1, t0.name AS name_2, t0.description AS description_3, t0.price AS price_4, t0.image AS image_5 FROM product t0 WHERE t0.id = ?',
          key: 'db.statement',
        },
      ],
      processID: '51744411b1130724',
      flags: 0,
      dataFrameRowIndex: 5,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 99088.5,
      depth: 3,
      hasChildren: false,
      childSpanCount: 0,
      warnings: [],
      childSpanIds: [],
      subsidiarilyReferencedBy: [
        {
          spanID: '93a9749d5ed5f505',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
          span: {
            traceID: '02ba116e8d4eb3edce2b884e8660f183',
            spanID: '93a9749d5ed5f505',
            parentSpanID: '57c1c8e91dfc1159',
            operationName: 'PDOStatement::execute',
            serviceName: 'faro-shop-backend',
            kind: 'client',
            statusCode: 0,
            statusMessage: '',
            instrumentationLibraryName: 'io.opentelemetry.contrib.php.pdo',
            instrumentationLibraryVersion: '',
            traceState: '',
            serviceTags: [
              {
                value: 'production',
                key: 'deployment.environment',
              },
              {
                value: 'aarch64',
                key: 'host.arch',
              },
              {
                value: 'grafana-k8s-monitoring-alloy-0',
                key: 'host.name',
              },
              {
                value: 'faro-shop-backend',
                key: 'k8s.deployment.name',
              },
              {
                value: 'faro-shop-control-plane',
                key: 'k8s.node.name',
              },
              {
                value: '10.244.0.15',
                key: 'k8s.pod.ip',
              },
              {
                value: '2025-01-09T11:54:17Z',
                key: 'k8s.pod.start_time',
              },
              {
                value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
                key: 'k8s.pod.uid',
              },
              {
                value: '6.8.0-51-generic',
                key: 'os.description',
              },
              {
                value: 'Linux',
                key: 'os.name',
              },
              {
                value: 'linux',
                key: 'os.type',
              },
              {
                value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
                key: 'os.version',
              },
              {
                value: '/usr/local/sbin/php-fpm',
                key: 'process.executable.path',
              },
              {
                value: 'www-data',
                key: 'process.owner',
              },
              {
                value: 87,
                key: 'process.pid',
              },
              {
                value: 'fpm-fcgi',
                key: 'process.runtime.name',
              },
              {
                value: '8.4.2',
                key: 'process.runtime.version',
              },
              {
                value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
                key: 'service.instance.id',
              },
              {
                value: 'faro-shop',
                key: 'service.namespace',
              },
              {
                value: '0.43.8',
                key: 'service.version',
              },
              {
                value: 'opentelemetry-php-instrumentation',
                key: 'telemetry.distro.name',
              },
              {
                value: '1.1.0',
                key: 'telemetry.distro.version',
              },
              {
                value: 'php',
                key: 'telemetry.sdk.language',
              },
              {
                value: 'opentelemetry',
                key: 'telemetry.sdk.name',
              },
              {
                value: '1.1.2',
                key: 'telemetry.sdk.version',
              },
              {
                value: 'faro-shop-backend',
                key: 'service.name',
              },
              {
                value: 'faro-shop',
                key: 'k8s.cluster.name',
              },
              {
                value: 'faro-shop',
                key: 'k8s.namespace.name',
              },
              {
                value: 'faro-shop-backend-68c986d54f-zzw7m',
                key: 'k8s.pod.name',
              },
            ],
            startTime: 1750238815102225.8,
            duration: 9748.168,
            logs: [],
            references: [
              {
                refType: 'CHILD_OF',
                spanID: '57c1c8e91dfc1159',
                traceID: '02ba116e8d4eb3edce2b884e8660f183',
              },
              {
                refType: 'FOLLOWS_FROM',
                spanID: '51744411b1130724',
                traceID: '2ba116e8d4eb3edce2b884e8660f183',
                tags: [],
              },
            ],
            tags: [
              {
                value: 'execute',
                key: 'code.function',
              },
              {
                value: 'PDOStatement',
                key: 'code.namespace',
              },
            ],
            processID: '93a9749d5ed5f505',
            flags: 0,
            dataFrameRowIndex: 6,
            process: {
              serviceName: 'faro-shop-backend',
              tags: [],
            },
            relativeStartTime: 101136.75,
            depth: 3,
            hasChildren: false,
            childSpanCount: 0,
            warnings: [],
            childSpanIds: [],
          },
          refType: 'FOLLOWS_FROM',
        },
      ],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: 'b435eb8971d239bf',
      parentSpanID: 'dffd8116bcaa2b2d',
      operationName: 'App\\Controller\\ProductController::detail',
      serviceName: 'faro-shop-backend',
      kind: 'internal',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815114163.8,
      duration: 1101238.224,
      logs: [
        {
          timestamp: 1750238816114598.5,
          fields: [
            {
              value: 'jp',
              key: 'app.country',
            },
          ],
          name: 'Aborting discount calculation due to timeout delay',
        },
      ],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: 'dffd8116bcaa2b2d',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
        },
      ],
      tags: [
        {
          value: 29,
          key: 'app.product.id',
        },
      ],
      processID: 'b435eb8971d239bf',
      flags: 0,
      dataFrameRowIndex: 3,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 113074.75,
      depth: 1,
      hasChildren: true,
      childSpanCount: 1,
      warnings: [],
      childSpanIds: ['5b82f6fa2358ec71'],
    },
    {
      traceID: '02ba116e8d4eb3edce2b884e8660f183',
      spanID: '5b82f6fa2358ec71',
      parentSpanID: 'b435eb8971d239bf',
      operationName: 'DiscountService.calculateDiscountForProduct',
      serviceName: 'faro-shop-backend',
      kind: 'internal',
      statusCode: 0,
      statusMessage: '',
      instrumentationLibraryName: 'com.grafana.faro-shop',
      instrumentationLibraryVersion: '',
      traceState: '',
      serviceTags: [
        {
          value: 'production',
          key: 'deployment.environment',
        },
        {
          value: 'aarch64',
          key: 'host.arch',
        },
        {
          value: 'grafana-k8s-monitoring-alloy-0',
          key: 'host.name',
        },
        {
          value: 'faro-shop-backend',
          key: 'k8s.deployment.name',
        },
        {
          value: 'faro-shop-control-plane',
          key: 'k8s.node.name',
        },
        {
          value: '10.244.0.15',
          key: 'k8s.pod.ip',
        },
        {
          value: '2025-01-09T11:54:17Z',
          key: 'k8s.pod.start_time',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'k8s.pod.uid',
        },
        {
          value: '6.8.0-51-generic',
          key: 'os.description',
        },
        {
          value: 'Linux',
          key: 'os.name',
        },
        {
          value: 'linux',
          key: 'os.type',
        },
        {
          value: '#52-Ubuntu SMP PREEMPT_DYNAMIC Thu Dec  5 13:32:09 UTC 2024',
          key: 'os.version',
        },
        {
          value: '/usr/local/sbin/php-fpm',
          key: 'process.executable.path',
        },
        {
          value: 'www-data',
          key: 'process.owner',
        },
        {
          value: 87,
          key: 'process.pid',
        },
        {
          value: 'fpm-fcgi',
          key: 'process.runtime.name',
        },
        {
          value: '8.4.2',
          key: 'process.runtime.version',
        },
        {
          value: 'd8207492-9f19-4cbd-8555-9b00dbcbc4b1',
          key: 'service.instance.id',
        },
        {
          value: 'faro-shop',
          key: 'service.namespace',
        },
        {
          value: '0.43.8',
          key: 'service.version',
        },
        {
          value: 'opentelemetry-php-instrumentation',
          key: 'telemetry.distro.name',
        },
        {
          value: '1.1.0',
          key: 'telemetry.distro.version',
        },
        {
          value: 'php',
          key: 'telemetry.sdk.language',
        },
        {
          value: 'opentelemetry',
          key: 'telemetry.sdk.name',
        },
        {
          value: '1.1.2',
          key: 'telemetry.sdk.version',
        },
        {
          value: 'faro-shop-backend',
          key: 'service.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.cluster.name',
        },
        {
          value: 'faro-shop',
          key: 'k8s.namespace.name',
        },
        {
          value: 'faro-shop-backend-68c986d54f-zzw7m',
          key: 'k8s.pod.name',
        },
      ],
      startTime: 1750238815114290.5,
      duration: 1050753.5620000002,
      logs: [
        {
          timestamp: 1750238815114304,
          fields: [],
          name: 'Calculating discount',
        },
        {
          timestamp: 1750238816114630.2,
          fields: [],
          name: 'Discount calculated',
        },
      ],
      references: [
        {
          refType: 'CHILD_OF',
          spanID: 'b435eb8971d239bf',
          traceID: '02ba116e8d4eb3edce2b884e8660f183',
          span: {
            traceID: '02ba116e8d4eb3edce2b884e8660f183',
            spanID: 'b435eb8971d239bf',
            parentSpanID: 'dffd8116bcaa2b2d',
            operationName: 'App\\Controller\\ProductController::detail',
            serviceName: 'faro-shop-backend',
            kind: 'internal',
            statusCode: 0,
            statusMessage: '',
            instrumentationLibraryName: 'io.opentelemetry.contrib.php.doctrine',
            instrumentationLibraryVersion: '',
            traceState: '',
            startTime: 1750238815114163.8,
            duration: 1101238.224,
            processID: 'b435eb8971d239bf',
            flags: 0,
            dataFrameRowIndex: 3,
            relativeStartTime: 113074.75,
            depth: 1,
            hasChildren: true,
            childSpanCount: 1,
          },
        },
      ],
      tags: [
        {
          value: 10,
          key: 'app.discount',
        },
        {
          value: 29,
          key: 'app.product.id',
        },
      ],
      processID: '5b82f6fa2358ec71',
      flags: 0,
      dataFrameRowIndex: 7,
      process: {
        serviceName: 'faro-shop-backend',
        tags: [],
      },
      relativeStartTime: 113201.5,
      depth: 2,
      hasChildren: false,
      childSpanCount: 0,
      warnings: [],
      childSpanIds: [],
    },
  ],
  traceID: '02ba116e8d4eb3edce2b884e8660f183',
  traceName: 'faro-shop-backend: GET product_detail',
  processes: {},
  duration: 1217414,
  startTime: 1750238815001089,
  endTime: 1750238816218503,
};
