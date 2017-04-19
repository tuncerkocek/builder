import {getStorage} from 'vc-cake'
import React from 'react'
import TreeViewElement from './lib/treeViewElement'
import TreeViewDndManager from './lib/treeViewDndManager'
import Scrollbar from '../../scrollbar/scrollbar.js'

const elementsStorage = getStorage('elements')
const workspaceStorage = getStorage('workspace')
const layoutStorage = getStorage('layout')

export default class TreeViewLayout extends React.Component {
  constructor (props) {
    super(props)
    this.updateElementsData = this.updateElementsData.bind(this)
    this.handleMouseOver = this.handleMouseOver.bind(this)
    this.handleMousePos = this.handleMousePos.bind(this)
    this.handleScrollToElement = this.handleScrollToElement.bind(this)
    this.interactWithContent = this.interactWithContent.bind(this)
    this.handleAddElement = this.handleAddElement.bind(this)
    this.handleAddTemplate = this.handleAddTemplate.bind(this)
    this.checkShowOutlineCallback = this.checkShowOutlineCallback.bind(this)
    this.onElementMount = this.onElementMount.bind(this)
    this.onElementUnmount = this.onElementUnmount.bind(this)
    this.dnd = new TreeViewDndManager()
    this.state = {
      data: [],
      selectedItem: null,
      outlineElementId: false
    }
  }
  updateElementsData (data) {
    this.setState({ data: data }, () => {
      // content.trigger('data:editor:render')
    })
  }
  componentDidMount () {
    elementsStorage.state('document').onChange(this.updateElementsData)
    layoutStorage.state('userInteractWith').onChange(this.interactWithContent)
    this.setState({
      header: document.querySelector('.vcv-ui-navbar-container').getBoundingClientRect(),
      data: elementsStorage.state('document').get()
    })
    this.handleScrollToElement()
    /*
    this.props.api.reply('bar-content-start:show', this.handleScrollToElement)
    this.props.api.reply('editorContent:control:mouseEnter', this.interactWithContent)
    this.props.api.reply('editorContent:control:mouseLeave', this.interactWithContent)
    */
  }

  componentWillUnmount () {
    elementsStorage.state('document').ignoreChange(this.updateElementsData)
    layoutStorage.state('userInteractWith').ignoreChange(this.interactWithContent)
    /*
    this.props.api.forget('bar-content-start:show', this.handleScrollToElement)
    this.props.api.forget('editorContent:control:mouseEnter', this.interactWithContent)
    this.props.api.forget('editorContent:control:mouseLeave', this.interactWithContent)
    */
  }
  interactWithContent (id = false) {
    this.setState({outlineElementId: id})
  }

  handleMousePos (e) {
    if (e.target.closest('.vcv-ui-outline-control-more') !== null) {
      if (document.querySelector('.vcv-layout-bar-content').classList.contains('vcv-ui-state--visible')) {
        let layoutBar = document.querySelector('.vcv-ui-navbar-container').getBoundingClientRect()
        let treeView = document.querySelector('.vcv-ui-tree-layout-container').getBoundingClientRect()
        let leftX = layoutBar.left
        let rightX = leftX + treeView.width
        let topY = layoutBar.bottom
        let bottomY = topY + treeView.height
        if (e.clientX > leftX && e.clientX < rightX && e.clientY > topY && e.clientY < bottomY) {
          this.state.selectedItem.classList.remove('vcv-ui-state--active')
          this.setState({
            selectedItem: null
          })
        }
      }
    }
  }

  handleMouseOver () {
    this.interactWithContent()
    this.handleSelectedItem()
  }

  handleSelectedItem (selectedItem = null) {
    if (this.state.selectedItem) {
      this.state.selectedItem.classList.remove('vcv-ui-state--active')
    }
    if (this.state.selectedItem !== selectedItem) {
      this.setState({
        selectedItem: selectedItem
      })
    }
    if (selectedItem) {
      selectedItem.classList.add('vcv-ui-state--active')
    }
  }

  expandTree (element) {
    if (!element.classList.contains('vcv-ui-tree-layout')) {
      if (element.classList.contains('vcv-ui-tree-layout-node-child') && !element.classList.contains('vcv-ui-tree-layout-node-expand')) {
        element.querySelector('.vcv-ui-tree-layout-node-expand-trigger').click()
      }
      this.expandTree(element.parentElement)
    }
  }

  handleScrollToElement (scrollToElement) {
    if (scrollToElement) {
      this.refs.scrollbars.scrollTop(0)
      let target = document.querySelector('[data-vcv-element="' + scrollToElement + '"]')
      this.expandTree(target)
      let offset = target.getBoundingClientRect().top
      this.handleSelectedItem(target.firstChild)
      this.refs.scrollbars.scrollTop(offset - this.state.header.height - this.state.header.bottom)
    }
  }
  checkShowOutlineCallback (id) {
    return this.state.outlineElementId === id
  }
  getElements () {
    let elementsList = []
    if (this.state.data) {
      elementsList = this.state.data.map((element) => {
        return <TreeViewElement
          element={element}
          key={element.id}
          level={1}
          showOutlineCallback={this.checkShowOutlineCallback}
          onMountCallback={this.onElementMount}
          onUnmountCallback={this.onElementUnmount}
        />
      }, this)
    }
    return elementsList
  }
  onElementMount (id) {
    this.dnd.add(id)
  }
  onElementUnmount (id) {
    this.dnd.remove(id)
  }
  handleAddElement (e) {
    e && e.preventDefault()
    workspaceStorage.trigger('add', null)
    // this.props.api.request('app:add', null)
  }

  handleAddTemplate (e) {
    e && e.preventDefault()
    workspaceStorage.trigger('add:template', true)
    // this.props.api.request('app:templates', true)
  }

  getElementsOutput () {
    let elements = this.getElements()
    if (elements.length) {
      return (
        <ul className='vcv-ui-tree-layout'>
          {elements}
        </ul>
      )
    }
    return (
      <div className='vcv-ui-tree-layout-messages'>
        <p className='vcv-ui-tree-layout-message'>
          There are no elements on your canvas - start by adding element or template
        </p>
      </div>
    )
  }

  render () {
    return (
      <div className='vcv-ui-tree-layout-container' onMouseOver={this.handleMouseOver}>
        <Scrollbar ref='scrollbars'>
          {this.getElementsOutput()}
          <div className='vcv-ui-tree-layout-actions'>
            <a
              className='vcv-ui-tree-layout-action'
              href='#'
              title='Add Element'
              onClick={this.handleAddElement}
            >
              <span className='vcv-ui-tree-layout-action-content'>
                <i className='vcv-ui-tree-layout-action-icon vcv-ui-icon vcv-ui-icon-add' />
                <span>Add element</span>
              </span>
            </a>
            <a
              className='vcv-ui-tree-layout-action'
              href='#'
              title='Template'
              onClick={this.handleAddTemplate}
            >
              <span className='vcv-ui-tree-layout-action-content'>
                <i className='vcv-ui-tree-layout-action-icon vcv-ui-icon vcv-ui-icon-template' />
                <span>Template</span>
              </span>
            </a>
          </div>
        </Scrollbar>
      </div>
    )
  }
}
