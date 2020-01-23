"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_job_handler_1 = __importDefault(require("base-job-handler"));
const business_monitor_1 = __importDefault(require("./business-monitor"));
class JobAcceptor extends base_job_handler_1.default {
    /**
     * Creates an instance of job acceptor.  JobAcceptor listens for and responds to job requests posted by JobRequestor to the redis messaging system
     * @param channels The channels to listen in on
     * @param businessTracker An event emitter that notifies JobAcceptor when to start/stop accepting jobs.
     * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
     * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
     * 'options' parameter must be given.
     * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
     */
    constructor(channels, businessTracker, publisher, subscriber, options) {
        super(channels, publisher, subscriber, options);
        this.channels = channels;
        /**
         * Contains the logic for which listener or response should be used for different job posting params.
         */
        this.acceptJob = (jobPostingChannel, message) => {
            // First, make sure that the module is currently available to work (not busy)
            if (this.businessMonitor.isAvailableForWork) {
                const messageAsJSON = JSON.parse(message);
                // If available, parse the string from Redis and check its params.
                // If the param is "report", send a message to the job acceptance channel that the module is "reporting" to the job.
                if (messageAsJSON.params === 'report') {
                    const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel];
                    const identifier = this.generateResponseIdentifier('reporting', messageAsJSON);
                    this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier));
                    /* If this module is chosen to take the job, an "accept" message will be sent back with this module's ipaddress as the targetIp.
                    Since the first thing that is done is to check if the module is currently available, the job will not be accepted if the module
                    became busy between the time of the job posting and the "accept" message.
                    The jobId itself is not important to this application, as it will respond in a first-come-first-served manner.  If this application
                    simultaneously responded to several job postings, the remaining job postings will time out after this job has been accepted.*/
                }
                else if (messageAsJSON.params === 'accept' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
                    /* Since the job is being accepted, the responseNotifier event emitter will need to emit an "accepting" event
                    with the job details to any listeners.  At that point, any job posters awaiting a response from this acceptor who were not picked up
                    will be able to recast for a different acceptor. */
                    this.responseNotifier.emit('accepting', messageAsJSON);
                    const jobAcceptanceChannel = this.postingToAcceptanceChannelDictionary[jobPostingChannel];
                    const identifier = this.generateResponseIdentifier('accepting', messageAsJSON);
                    // Notify the job poster that the job is being accepted.  This completes this module's part of the handshake
                    this.publisher.publish(jobAcceptanceChannel, JSON.stringify(identifier));
                    // Finally, if the job was successfully accepted, then this application will expect the job poster to respond with a "confirmed" event.
                }
                else if (messageAsJSON.params === 'confirmed' && messageAsJSON.targetIp && messageAsJSON.targetIp === this.ipAddress) {
                    /* the responseNotifier event emitter will need to emit a "confirmed" event to any listeners, again with the job details,
                    to initiate any "confimed" event actions. */
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
    /**
     * When called, the JobAcceptor will attach a listener to the subscriber and begin responding to job postings
     */
    beginAcceptingJobs() {
        this.subscriber.on('message', this.acceptJob);
    }
    /**
     * Stop accepting jobs.  Usually if the application needs to shut down for maintenance.
     */
    stopAcceptingJobs() {
        this.subscriber.off('message', this.acceptJob);
    }
    /**
     * Generates response identifier to be sent back to any job posters.
     * @param params the response message to send back
     * @param baseIdentifier The job poster's identifier
     * @returns an identifier with this module's identifying information
     */
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