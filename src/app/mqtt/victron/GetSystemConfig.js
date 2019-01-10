import React from "react"
import { parseTopic } from "../../utils/util"
import { MqttClientContext } from "../../contexts"
import { getShorePowerInputNumber } from "./GetShorePowerInputNumber"

/**
 * vebus can represent an inverter or an inverter/charger
 * we can determine if it's an inverter/charger by looking at /Ac/NumberOfOutputs
 * @returns {boolean}
 */
const isVebusOnlyInverter = (portalId, deviceInstanceId) => {
  // // /Ac/NumberOfInputs
  // const topics = {
  //   numberOfOutputs: `N/${portalId}/vebus/${deviceInstanceId}/Ac/NumberOfOutputs`
  // }
  // // getMessagesByTopics
  // this.context.subscribeInBulk(topics)
  // const result = this.context.getMessagesByTopics(topics)
  return false
}

const getComponentsForSystem = () => {}

const configTopics = {
  batteries: portalId => ({
    batteries: `N/${portalId}/system/0/Batteries`
  }),
  inverter: {},
  inverterCharger: (portalId, vebusInstanceId, shorePowerInput) => ({
    modeIsAdjustable: `N/${portalId}/vebus/${vebusInstanceId}/ModeIsAdjustable`,
    currentLimitIsAdjustable: `N/${portalId}/vebus/${vebusInstanceId}/Ac/In/${shorePowerInput}/CurrentLimitIsAdjustable`
  }),
  charger: (portalId, deviceInstanceId) => ({
    nrOfOutputs: `N/${portalId}/charger/${deviceInstanceId}/NrOfOutputs`
  }),
  solar: portalId => ({
    power: `N/${portalId}/system/0/Dc/Pv/Power`,
    current: `N/${portalId}/system/0/Dc/Pv/Current`
  }),
  acLoads: portalId => ({
    phases: `N/${portalId}/system/0/Ac/Consumption/NumberOfPhases`
  }),
  dcLoads: portalId => ({
    hasDcSystem: `N/${portalId}/settings/0/Settings/SystemSetup/HasDcSystem`
  })
}

const setupTopics = {
  settings: portalId => ({
    acInput1: `N/${portalId}/settings/0/Settings/SystemSetup/AcInput1`,
    acInput2: `N/${portalId}/settings/0/Settings/SystemSetup/AcInput2`,
    hasDcSystem: `N/${portalId}/settings/0/Settings/SystemSetup/HasDcSystem`
  }),
  system: portalId => ({
    batteries: `N/${portalId}/system/0/Batteries`,
    power: `N/${portalId}/system/0/Dc/Pv/Power`,
    current: `N/${portalId}/system/0/Dc/Pv/Current`,
    phases: `N/${portalId}/system/0/Ac/Consumption/NumberOfPhases`
  }),
  inverter: {},
  vebus: (portalId, vebusInstanceId, shorePowerInput) => {
    return {
      modeIsAdjustable: `N/${portalId}/vebus/${vebusInstanceId}/ModeIsAdjustable`,
      currentLimitIsAdjustable: `N/${portalId}/vebus/${vebusInstanceId}/Ac/In/${shorePowerInput}/CurrentLimitIsAdjustable`
    }
  },
  charger: (portalId, deviceInstanceId) => ({
    nrOfOutputs: `N/${portalId}/charger/${deviceInstanceId}/NrOfOutputs`
  })
}

class GetSystemConfig extends React.Component {
  state = {
    deviceList: null,
    settings: null,
    system: null,
    components: []
  }

  handleDevice = (serviceType, deviceInstanceId, portalId) => {
    let components = []
    if (serviceType === "charger") {
      components.push({
        size: "L",
        type: "charger",
        deviceInstanceId: deviceInstanceId,
        priority: 8
      })
    } else if (serviceType === "vebus") {
      if (isVebusOnlyInverter(portalId, deviceInstanceId)) {
        components.push({
          size: "S",
          type: "inverter",
          deviceInstanceId: deviceInstanceId,
          priority: 7
        })
      } else {
        components.push({
          size: "S",
          type: "inverter/charger",
          deviceInstanceId: deviceInstanceId,
          priority: 6
        })
      }

      const chargerInfo = configTopics.charger(portalId, deviceInstanceId)
      this.context.subscribeInBulk(chargerInfo)
      const result = this.context.getMessagesByTopics(chargerInfo)
      console.log("RESULT", chargerInfo)
    }

    return components
  }

  getComponentsForSystem = (portalId, messages) => {
    const devices = Object.keys(messages)
      .map(topic => parseTopic(topic))
      .reduce((result, item) => {
        if (!result[item.serviceType]) {
          result[item.serviceType] = {}
        }
        result[item.deviceInstance] = {}
      }, {})
    // .map(items => [items.serviceType, items.deviceInstance])
    const settings = this.context.getMessagesByTopics(setupTopics.settings(portalId))

    console.log("Devices: ", devices)

    let layout = {}

    let components = []
    devices.forEach(item => {
      const serviceType = item[0]
      const deviceInstanceId = item[1]
      if (setupTopics[serviceType]) {
        console.log("RESULT", setupTopics[serviceType](portalId, deviceInstanceId, settings))
        this.context.subscribeInBulk(setupTopics[serviceType](portalId, deviceInstanceId, settings))
      }

      console.log(serviceType, deviceInstanceId, portalId)
      const deviceComponents = this.handleDevice(serviceType, deviceInstanceId, portalId)
      components = components.concat(deviceComponents)
    })

    return components
  }

  componentDidMount() {
    const { portalId } = this.props
    this.context.subscribeInBulk({
      allDevices: "N/+/+/+/DeviceInstance",
      ...setupTopics.settings(portalId),
      ...setupTopics.system(portalId)
    })
  }

  componentDidUpdate() {
    const { portalId } = this.props
    const deviceInstanceMessages = this.context.getMessagesByWildcard(`N/+/+/+/DeviceInstance`)
    if (JSON.stringify(deviceInstanceMessages) !== JSON.stringify(this.state.deviceInstanceMessages)) {
      const devices = Object.keys(deviceInstanceMessages)
        .map(topic => parseTopic(topic))
        .reduce((result, item) => {
          if (!result[item.serviceType]) {
            result[item.serviceType] = {}
          }
          console.log(result)
          result[item.serviceType][item.deviceInstance] = {}
          return result
        }, {})

      if (devices.charger) {
        Object.keys(devices.charger).forEach(chargerId => {
          this.context.subscribeInBulk(setupTopics.charger(portalId, chargerId))
        })
      }

      if (devices.vebus) {
        Object.keys(devices.vebus).forEach(vebusInstanceId => {
          this.context.subscribeInBulk(setupTopics.vebus(portalId, vebusInstanceId, this.state.shorePowerInput))
        })
      }

      this.setState({
        deviceInstanceMessages: deviceInstanceMessages,
        devices
      })
    }

    const settings = this.context.getMessagesByTopics(setupTopics.settings(portalId))
    if (JSON.stringify(settings) !== JSON.stringify(this.state.settings)) {
      this.setState({ settings, shorePowerInput: getShorePowerInputNumber(settings.acInput1, settings.acInput2) })
    }

    const system = this.context.getMessagesByTopics(setupTopics.system(portalId))
    if (JSON.stringify(system) !== JSON.stringify(this.state.system)) {
      this.setState({ system })
    }

    console.log("COMPONENT DID UPDATE", this.state)
  }

  render() {
    const { children } = this.props

    console.log("STATE ", this.state)

    return null

    return children({
      inverter: {
        show: false
      }
    })

    // return (
    //   <MqttTopicWildcard wildcard={`N/+/+/+/DeviceInstance`}>
    //     {messages => {
    //       // { batteries, inverter, inverterCharger, chargers, solar, settings }
    //       // { batteries: { show: true, layout: 'list' }, inverterCharger: { show: false }
    //       // { inverter: { show: true, 3phase: true } }
    //
    //       return null
    //
    //       // return (
    //       //   <MqttSubscriptions topics={getTopics(portalId, vebusInstanceId, shorePowerInput)}>
    //       //     {topics => {
    //       //       return (
    //       //         <ShoreInputLimit
    //       //           currentLimit={formatNumber({ value: topics.currentLimit, unit: "A" })}
    //       //           isAdjustable={topics.currentLimitIsAdjustable}
    //       //           onChangeShoreInputLimitClicked={() => onChangeShoreInputLimitClicked(vebusInstanceId)}
    //       //         />
    //       //       )
    //       //     }}
    //       //   </MqttSubscriptions>
    //       // )
    //     }}
    //   </MqttTopicWildcard>
    // )
  }
}
GetSystemConfig.contextType = MqttClientContext

export default GetSystemConfig
