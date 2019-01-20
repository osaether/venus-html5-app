import React from "react"

import { RELAY_STATE } from "../../utils/constants"

import HeaderView from "../HeaderView/HeaderView"
import HidingContainer from "../HidingContainer"
import MetricValues from "../MetricValues"
import MqttSubscriptions from "../../mqtt/MqttSubscriptions"
import MqttWriteValue from "../../mqtt/MqttWriteValue"
import NumericValue from "../NumericValue/index"
import SelectorButton from "../SelectorButton"

import "./Relay.scss"

const getTopics = portalId => {
  return {
    state: `N/${portalId}/system/0/Relay/0/State`
  }
}

export const Relay = ({ state, OnUpdateState }) => {
  return (
    <div className="metric relay">
      <HeaderView title="Relay" />
      <div className="relay__state-set">
        <SelectorButton active={state === RELAY_STATE.OFF} onClick={() => OnUpdateState(RELAY_STATE.ON)}>
          On
        </SelectorButton>
        <SelectorButton active={state === RELAY_STATE.ON} onClick={() => OnUpdateState(RELAY_STATE.OFF)}>
          Off
        </SelectorButton>
      </div>
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
