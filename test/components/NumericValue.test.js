import { h } from "preact"
import { shallow } from "preact-render-spy"
import NumericValue from "../../src/app/components/NumericValue"

describe("Number display", () => {
  it("shows dashes when no value given", () => {
    const context = shallow(<NumericValue />)
    expect(context.find("p").text()).toBe("--")
  })

  it("displays 0 values", () => {
    const context = shallow(<NumericValue value={0} />)
    expect(context.find("p").text()).toBe("0")
  })

  it("adds a unit to the value passed", () => {
    const context = shallow(<NumericValue value={123} unit="A" />)
    expect(context.find("p").text()).toBe("123A")
  })
})