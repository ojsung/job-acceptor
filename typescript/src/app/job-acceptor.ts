import { RedisClient, ClientOpts } from 'redis'
import BaseJobHandler, {IMessageCallback, IChannelInfo, IChannelIdentifier} from 'base-job-handler'
import { EventEmitter } from 'events'
import BusinessMonitor from './business-monitor'

export class JobAcceptor extends BaseJobHandler {
  constructor(
    protected readonly channels: IChannelInfo[],
    businessTracker: EventEmitter,
    publisher?: RedisClient,
    subscriber?: RedisClient,
    options?: ClientOpts
  ) {
    super(channels, publisher, subscriber, options)
    // Fill the channel list with all the channels that should be subscribed to/published to
    this.channelContainer = this.constructionValidator.fillChannelContainer(this.channels)
    const channelList = Object.keys(this.channelContainer)
    channelList.forEach(channel => {
      const jobAcceptanceChannel = channel + '-accept'
      const jobPostingChannel = channel + '-post'
      this.postingToAcceptanceChannelDictionary[jobPostingChannel] = jobAcceptanceChannel
      this.acceptanceToPostingChannelDictionary[jobAcceptanceChannel] = jobPostingChannel
      // subscribe to all the channels in the list
      this.subscribedChannels.push(jobPostingChannel, jobAcceptanceChannel)
    })
    this.businessMonitor = new BusinessMonitor(businessTracker)
    this.businessMonitor.beginListening(businessTracker)
  }

  private readonly businessMonitor: BusinessMonitor

  public beginAcceptingJobs() {
    this.subscriber.on('message', this.acceptJob)
  }

  public stopAcceptingJobs() {
    this.subscriber.off('message', this.acceptJob)
  }

  private acceptJob: IMessageCallback = (jobPostingChannel: string, message: string) => {
    if (this.businessMonitor.isAvailableForWork) {
      const messageAsJSON = JSON.parse(message) as IChannelIdentifier
      if (messageAsJSON.params === 'report') {
        const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel]
        const identifier: IChannelIdentifier = this.generateResponseIdentifier('reporting', messageAsJSON)
        this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier))
      } else if (messageAsJSON.params === 'accept' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
        this.responseNotifier.emit('accepting', messageAsJSON)
        const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel]
        const identifier: IChannelIdentifier = this.generateResponseIdentifier('accepting', messageAsJSON)
        this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier))
      } else if (messageAsJSON.params === 'confirmed' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
        this.responseNotifier.emit('confirmed', messageAsJSON)
      }
    }
  }

  private generateResponseIdentifier(params: string, baseIdentifier: IChannelIdentifier): IChannelIdentifier {
    const identifier: IChannelIdentifier = {
      jobId: baseIdentifier.jobId,
      requesterIp: baseIdentifier.requesterIp,
      responderIp: this.ipAddress,
      targetIp: baseIdentifier.requesterIp,
      params
    }
    return identifier
  }
}
