import React from 'react';
import {ESTIMATION_SCHEMES} from "../config/Constants";

const EstimateSchemeSelect = (props) => {
  {
    const [head, ...tail] = ESTIMATION_SCHEMES;
    return (
      <div className="form-group">
        <label>
          Estimation Scheme
        </label>
          {_renderRadioBtn(head.name, true)}
          {tail.map(x => _renderRadioBtn(x.name, false))}
      </div>
    )
  }
}

function _renderRadioBtn(value, isChecked) {
  return (
    <div className="radio" key={value}>
      <label><input type="radio" checked={isChecked}/>{value}</label>
    </div>
  )
}

export default EstimateSchemeSelect;
