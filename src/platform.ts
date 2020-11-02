/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Philips_Remote_Tv } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  device = Device;
  list: Device[] = [];
    
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    
    const configPath = api.user.configPath();
    const fs = require('fs');
    const rawdata = fs.readFileSync(configPath);
    const student = JSON.parse(rawdata);
    const obj = student.platforms;
    const ob = Object.keys(obj);
    for(const k in ob){
      if(Object.prototype.hasOwnProperty.call(obj[k], 'platform')){
        const val = obj[k];
        if(Object.values(val).includes( 'Philips_Remote_Tv')){

          if(Object.prototype.hasOwnProperty.call(val, 'devices')){
            const arr: unknown[] = val.devices;
            // console.log(arr);
            for(const k of arr){
              const object = JSON.parse(JSON.stringify(k));
              console.log(object);
              this.list.push(new this.device(object.tv, object.ip_adress, object.mac_adress));
              
            }
   
          }
        }
      }
      //console.log(this.list);
     
      
      /*
      if(obj[k].platform === 'Philips_Remote_Tv'){
        const object = obj[k];
        console.log(object);
      }
      */
    }
    
    //console.log(this.list);
    //console.log(Object.prototype.hasOwnProperty.call(ob, 'myKey'));
    /*
    for (const [keys, value] of Object.entries(Object.keys(ob))) {
      console.log(`${keys}: ${value}`);
    }
    */
   
    
    

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    /*
    const exampleDevices = [
      {
        exampleUniqueId: 'ABCD',
        exampleDisplayName: 'Bedroom',
      },
      
    ];
    */

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of this.list) {
      
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.mac_adress);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (device) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new Philips_Remote_Tv(this, existingAccessory);
          
          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!device) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.tv);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.tv, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;
        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new Philips_Remote_Tv(this, accessory);

        // link the accessory to your platform
        // this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
      }
    }
  }
}

class Device {
  tv: string;
  ip_adress: string;
  mac_adress: string;
  constructor(tv: string, ip_adress: string, mac_adress: string){
    this.tv = tv;
    this.ip_adress = ip_adress;
    this.mac_adress = mac_adress;
  }
}