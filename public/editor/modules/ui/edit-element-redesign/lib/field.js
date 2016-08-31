import React from 'react'
import {format} from 'util'

export default class EditFromField extends React.Component {
  static propTypes = {
    api: React.PropTypes.object.isRequired,
    element: React.PropTypes.object.isRequired,
    fieldKey: React.PropTypes.string.isRequired,
    updater: React.PropTypes.func.isRequired,
    setFieldMount: React.PropTypes.func.isRequired,
    setFieldUnmount: React.PropTypes.func.isRequired
  }

  componentDidMount () {
    /* this.props.api.notify('field:mount', this.props.fieldKey)
     let { element, fieldKey, updater } = this.props
     let { type } = element.settings(fieldKey)
     if (!type) {
     throw new Error(format('Wrong attribute type %s', fieldKey))
     }
     let rawValue = type.getRawValue(element.data, fieldKey)
     updater(fieldKey, rawValue)
     */
    this.props.setFieldMount(this.props.fieldKey)
  }

  componentWillUnmount () {
    this.props.setFieldUnmount(this.props.fieldKey)
    // this.props.api.notify('field:unmount', this.props.fieldKey)
  }

  render () {
    let { element, fieldKey } = this.props
    let { type, settings } = element.settings(fieldKey)
    let AttributeComponent = type.component
    if (!AttributeComponent) {
      return null
    }
    if (!settings) {
      throw new Error(format('Wrong attribute settings %s', fieldKey))
    }
    if (!type) {
      throw new Error(format('Wrong attribute type %s', fieldKey))
    }
    const { options } = settings
    let label = ''
    if (options && typeof options.label === 'string') {
      label = (<span className='vcv-ui-form-group-heading'>{options.label}</span>)
    }
    let description = ''
    if (options && typeof options.description === 'string') {
      description = (<p className='vcv-ui-form-helper'>{options.description}</p>)
    }
    let rawValue = type.getRawValue(element.data, fieldKey)
    // let value = type.getValue(settings, element.data, fieldKey)

    return (
      <div className='vcv-ui-form-group' key={'form-group-' + fieldKey}>
        {label}
        <AttributeComponent
          key={'attribute-' + fieldKey + element.get('id')}
          options={options}
          value={rawValue}
          {...this.props}
        />
        {description}
      </div>
    )
  }
}
