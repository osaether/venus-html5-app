import React from "react"
import Switch from "react-switch"

import { RELAY_STATE } from "../../utils/constants"

import HidingContainer from "../HidingContainer"
import MqttSubscriptions from "../../mqtt/MqttSubscriptions"
import MqttWriteValue from "../../mqtt/MqttWriteValue"

const getTopics = portalId => {
  return {
    relayFunction: `N/${portalId}/settings/0/Settings/Relay/Function`,
    state: `N/${portalId}/system/0/Relay/0/State`
  }
}

export const Relay = ({ state, OnUpdateState }) => {
  return (
    <div className="metric relay">
      <label htmlFor="normal-switch">
        <span>Relay 1</span>
        {state === RELAY_STATE.OFF && (
          <Switch onColor="#30afff" onChange={() => OnUpdateState(RELAY_STATE.ON)} checked={state} />
        )}
        {state === RELAY_STATE.ON && (
          <Switch onColor="#30afff" onChange={() => OnUpdateState(RELAY_STATE.OFF)} checked={state} />
        )}
      </label>
    </div>
  )
}

const RelayWithData = ({ portalId, metricsRef }) => (
  <MqttSubscriptions topics={getTopics(portalId)}>
    {topics => {
      return (
        <MqttWriteValue topic={`W/${portalId}/system/0/Relay/0/State`}>
          {(_, updateState) => {
            return (
              <HidingContainer metricsRef={metricsRef}>
                <Relay {...topics} OnUpdateState={updateState} />
              </HidingContainer>
            )
          }}
        </MqttWriteValue>
      )
    }}
  </MqttSubscriptions>
)

export default RelayWithData
