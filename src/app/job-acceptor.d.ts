/// <reference types="node" />
import { RedisClient, ClientOpts } from 'redis';
import BaseJobHandler, { IChannelInfo } from 'base-job-handler';
import { EventEmitter } from 'events';
export declare class JobAcceptor extends BaseJobHandler {
    protected readonly channels: IChannelInfo[];
    constructor(channels: IChannelInfo[], businessTracker: EventEmitter, publisher?: RedisClient, subscriber?: RedisClient, options?: ClientOpts);
    private readonly businessMonitor;
    beginAcceptingJobs(): void;
    stopAcceptingJobs(): void;
    private acceptJob;
    private generateResponseIdentifier;
}
