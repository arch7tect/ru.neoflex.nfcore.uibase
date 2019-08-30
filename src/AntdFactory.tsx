
import {ViewFactory, View} from './View'
import Ecore from "ecore";
import * as React from "react";

class ViewContainer extends View {
    renderChildren = () => {
        const children = this.viewObject.get("children") as Ecore.EObject[]
        return children.map(c=>this.viewFactory.createView(c, this.props))
    }
    render = () => {
        return <div>{this.renderChildren()}</div>
    }
}

class AntdFactory implements ViewFactory {
    name = 'antd'
    components = new Map<string, typeof View>()
    constructor() {
        this.components.set('ru.neoflex.nfcore.application#//ViewContainer', ViewContainer)
    }
    createView = (viewObject: Ecore.EObject, props: any) => {
        let Component = this.components.get(viewObject.eClass.eURI());
        if (!Component) {
            Component = View
        }
        return <Component viewObject={viewObject} мvievFactory={this} {...props}/>
    }
}

export default new AntdFactory()
