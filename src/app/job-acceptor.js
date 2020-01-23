"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_job_handler_1 = __importDefault(require("base-job-handler"));
const business_monitor_1 = __importDefault(require("./business-monitor"));
class JobAcceptor extends base_job_handler_1.default {
    constructor(channels, businessTracker, publisher, subscriber, options) {
        super(channels, publisher, subscriber, options);
        this.channels = channels;
        this.acceptJob = (jobPostingChannel, message) => {
            if (this.businessMonitor.isAvailableForWork) {
                const messageAsJSON = JSON.parse(message);
                if (messageAsJSON.params === 'report') {
                    const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel];
                    const identifier = this.generateResponseIdentifier('reporting', messageAsJSON);
                    this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier));
                }
                else if (messageAsJSON.params === 'accept' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
                    this.responseNotifier.emit('accepting', messageAsJSON);
                    const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel];
                    const identifier = this.generateResponseIdentifier('accepting', messageAsJSON);
                    this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier));
                }
                else if (messageAsJSON.params === 'confirmed' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
                    this.responseNotifier.emit('confirmed', messageAsJSON);
                }
            }
        };
        // Fill the channel list with all the channels that should be subscribed to/published to
        this.channelContainer = this.constructionValidator.fillChannelContainer(this.channels);
        const channelList = Object.keys(this.channelContainer);
        channelList.forEach(channel => {
            const jobAcceptanceChannel = channel + '-accept';
            const jobPostingChannel = channel + '-post';
            this.postingToAcceptanceChannelDictionary[jobPostingChannel] = jobAcceptanceChannel;
            this.acceptanceToPostingChannelDictionary[jobAcceptanceChannel] = jobPostingChannel;
            // subscribe to all the channels in the list
            this.subscribedChannels.push(jobPostingChannel, jobAcceptanceChannel);
        });
        this.businessMonitor = new business_monitor_1.default(businessTracker);
        this.businessMonitor.beginListening(businessTracker);
    }
    beginAcceptingJobs() {
        this.subscriber.on('message', this.acceptJob);
    }
    stopAcceptingJobs() {
        this.subscriber.off('message', this.acceptJob);
    }
    generateResponseIdentifier(params, baseIdentifier) {
        const identifier = {
            jobId: baseIdentifier.jobId,
            requesterIp: baseIdentifier.requesterIp,
            responderIp: this.ipAddress,
            targetIp: baseIdentifier.requesterIp,
            params
        };
        return identifier;
    }
}
exports.JobAcceptor = JobAcceptor;
//# sourceMappingURL=job-acceptor.js.map