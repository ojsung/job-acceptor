/// <reference types="node" />
import { EventEmitter } from 'events';
/**
 * Receives an event emitter that will notify it if the application is too busy to accept any new jobs.
 * It is it told that the application is busy, it will notify JobAcceptor that it needs to stop accepting new jobs.
 * Will also be used to stop receiving jobs to prepare for shutdown in case of maintenance.
 */
export default class BusinessMonitor {
    /**
     * Gets whether the application is available for work
     */
    constructor(businessTracker: EventEmitter);
    get isAvailableForWork(): boolean;
    private static _isAvailableForWork;
    private static hasBeenInitialized;
    /**
     * Begins listening to the businessTracker.  This must happen before isAvailableForWork can know whether it's available
     * @param businessTracker An EventEmitter that emits the "busy" event with a boolean value as to whether it is busy or not
     * @returns true if the application has begun listening.  If false, it will need to be called again. Node can be strange sometimes.
     */
    beginListening(businessTracker: EventEmitter): boolean;
    private addListenerIfNotAlreadyAdded;
    private static checkForListener;
    private renameListenerAsCheckBusiness;
    /**
     * @todo: Will this stop working after the first job is done?  After the first job finishes, will this die?
     * I need... to make this static.  But I also want to require it to be set at the dawn of time... how to I go about this?
     * @param isBusy
     */
    private static checkBusiness;
}
