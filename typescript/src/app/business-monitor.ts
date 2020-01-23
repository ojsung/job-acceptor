import { EventEmitter } from 'events'

/**
 * Receives an event emitter that will notify it if the application is too busy to accept any new jobs.
 * It is it told that the application is busy, it will notify JobAcceptor that it needs to stop accepting new jobs.
 * Will also be used to stop receiving jobs to prepare for shutdown in case of maintenance.
 */
export default class BusinessMonitor {
  /**
   * Gets whether the application is available for work
   */

  constructor(businessTracker: EventEmitter) {
    this.beginListening(businessTracker)
  }

  public get isAvailableForWork() {
    if (!BusinessMonitor.hasBeenInitialized) {
      throw new Error(
        'You must first call "BusinessMonitor.beginListening(businessTracker: EventEmitter)'
      )
    } else return BusinessMonitor._isAvailableForWork
  }

  private static _isAvailableForWork: boolean = true
  private static hasBeenInitialized: boolean = false

  /**
   * Begins listening to the businessTracker.  This must happen before isAvailableForWork can know whether it's available
   * @param businessTracker An EventEmitter that emits the "busy" event with a boolean value as to whether it is busy or not
   * @returns true if the application has begun listening.  If false, it will need to be called again. Node can be strange sometimes.
   */
  public beginListening(businessTracker: EventEmitter): boolean {
    this.addListenerIfNotAlreadyAdded(businessTracker)
    return BusinessMonitor.hasBeenInitialized
  }

  private addListenerIfNotAlreadyAdded(businessTracker: EventEmitter) {
    this.renameListenerAsCheckBusiness()
    const eventName = 'busy'
    let businessListenerAttached: boolean = BusinessMonitor.checkForListener(businessTracker, eventName)
    if (!businessListenerAttached) {
      businessTracker.on(eventName, BusinessMonitor.checkBusiness)
    }
    BusinessMonitor.hasBeenInitialized = true
  }

  private static checkForListener(businessTracker: EventEmitter, eventName: string) {
    const businessListenerName = this.checkBusiness.name
    // get all the listeners currently attached to businessTracker
    const currentListeners = businessTracker.listeners(eventName)
    const listenerCount = currentListeners.length
    let businessListenerAttached: boolean = false
    // loop through the listeners and see if any of them are our listener
    for (let i = 0, j = listenerCount; i < j; ++i) {
      const currentListener = currentListeners[i]
      const listenerName = currentListener.name
      if (listenerName === businessListenerName) {
        businessListenerAttached = true
        break
      }
    }
    return businessListenerAttached
  }

  private renameListenerAsCheckBusiness() {
    if (BusinessMonitor.checkBusiness.name !== 'checkBusiness') {
      Object.defineProperty(BusinessMonitor.checkBusiness, 'name', {
        value: 'checkBusiness',
        writable: false,
        enumerable: false,
        configurable: true
      })
    }
  }

  /**
   * @todo: Will this stop working after the first job is done?  After the first job finishes, will this die?
   * I need... to make this static.  But I also want to require it to be set at the dawn of time... how to I go about this?
   * @param isBusy
   */
  private static checkBusiness(isBusy: boolean) {
    if (isBusy) {
      BusinessMonitor._isAvailableForWork = false
    } else {
      BusinessMonitor._isAvailableForWork = true
    }
  }
}
