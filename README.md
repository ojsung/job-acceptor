# job-acceptor

Subscribes to Redis pubsub channels and picks up jobs posted. Routes jobs to a handler, and manages responding to update requests.

## Usage

The default export of this package is the "JobAcceptor" class.
The class has two public methods called `beginAcceptingJobs` and `stopAcceptingJobs`. It also has a public property called `responseNotifier`.
A listener must be subscribed to `responseNotifier` to receive notification for when a job has been accepted.

### Interfaces

```typescript
interface IChannelInfo {
  jobType: string
  channel?: string
  timeout?: number
  reRequest?: number
}
```

### Creating an instance of the class

The constructor takes the following parameters:

```typescript
/**
 * Creates an instance of job acceptor.  JobAcceptor listens for and responds to job requests posted by JobRequestor to the redis messaging system
 * @param channels The channels to listen in on.  It should be an array of IChannelInfo
 * @param businessTracker An event emitter that notifies JobAcceptor when to start/stop accepting jobs.
 * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
 * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
 * 'options' parameter must be given.
 * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
 */
```

### Example

```typescript
import {createClient, ClientOpts, RedisClient } from 'redis'
import { JobRequestor, IChannelInfo, IChannelIdentifier } from 'job-requestor'
const channels: IChannelInfo[] = [
  {
    jobType: 'runScript',
    channel: null, // This will be set to the jobType ("runScript") since it is falsy
    timeout: 80000, // milliseconds
    reRequest: 2000 // milliseconds
  },
  {
    jobType: 'runAnotherScript',
    channel: 'otherScriptChannel'
    // timeout will default to 30000 ms
    // reRequest will default to 5000 ms
  }
]
const clientOpts: ClientOpts = {
  host: 'localhost',
  port: 3000
}

const maxAllowableJobs: number = 10
let jobsAccepted: number = 0

const publisher: RedisClient = createClient(clientOpts)
const subscriber: RedisClient = publisher.duplicate()
const businessTracker: EventEmitter = new EventEmitter()
const jobAcceptor: JobAcceptor = new JobAcceptor(
  channels,
  businessTracker,
  publisher,
  subscriber
)
const responseNotifier: EventEmitter = jobAcceptor.responseNotifier
jobAcceptor.beginAcceptingJobs()
responseNotifier.on('confirmed', (identifyingInformation: IChannelIdentifier) => {
  doSomething(identifyingInformation)
  ++jobsAccepted
  if(jobsAccepted >== maxAllowableJobs) {
    jobAcceptor.stopAcceptingJobs()
  }
})
```
