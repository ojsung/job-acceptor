/// <reference types="node" />
import { RedisClient, ClientOpts } from 'redis';
import BaseJobHandler, { IChannelInfo } from 'base-job-handler';
import { EventEmitter } from 'events';
export declare class JobAcceptor extends BaseJobHandler {
    protected readonly channels: IChannelInfo[];
    /**
     * Creates an instance of job acceptor.  JobAcceptor listens for and responds to job requests posted by JobRequestor to the redis messaging system
     * @param channels The channels to listen in on
     * @param businessTracker An event emitter that notifies JobAcceptor when to start/stop accepting jobs.
     * @param [publisher] Optional.  If it is not provided, the 'options' paramter must be given.  A RedisClient instance that is NOT set as a subscriber
     * @param [subscriber] Optional. If it is not provided, but publisher is, it will be duplicated from the publisher.  If publisher is not provided, then the
     * 'options' parameter must be given.
     * @param [options] Optional.  If it is not provided, then the 'publisher' parameter must be given.  The Redis.ClientOpts to use to create the RedisClient.
     */
    constructor(channels: IChannelInfo[], businessTracker: EventEmitter, publisher?: RedisClient, subscriber?: RedisClient, options?: ClientOpts);
    private readonly businessMonitor;
    /**
     * When called, the JobAcceptor will attach a listener to the subscriber and begin responding to job postings
     */
    beginAcceptingJobs(): void;
    /**
     * Stop accepting jobs.  Usually if the application needs to shut down for maintenance.
     */
    stopAcceptingJobs(): void;
    /**
     * Contains the logic for which listener or response should be used for different job posting params.
     */
    private acceptJob;
    /**
     * Generates response identifier to be sent back to any job posters.
     * @param params the response message to send back
     * @param baseIdentifier The job poster's identifier
     * @returns an identifier with this module's identifying information
     */
    private generateResponseIdentifier;
}
