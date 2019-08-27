
import Ecore from 'ecore'
import * as React from "react";
import antdFactory from './AntdFactory'

export class View extends React.Component<any, any> {
    protected viewObject: Ecore.EObject
    protected viewFactory: ViewFactory

    setViewObject(eObject: Ecore.EObject) {
        this.viewObject = eObject
    }

    setViewFactory(viewFactory: ViewFactory) {
        this.viewFactory = viewFactory
    }

    render = () => {
        return <span>{this.viewObject.eResource().to()}</span>
    }
}

export interface ViewFactory {
    createView(viewObject: Ecore.EObject, props: any): View;
    name: string;
}

export class ViewRegistry {
    static INSTANCE = new ViewRegistry()
    private registry: Map<string, ViewFactory> = new Map<string, ViewFactory>();
    register(factory: ViewFactory): void {
        this.registry.set(factory.name, factory)
    }
    get(name: string): ViewFactory {
        const factory = this.registry.get(name)
        if (!factory) {
            throw new Error(`ViewFactory ${name} is not defined`)
        }
        return factory
    }
}


export class ViewContainer extends View {
    renderChildren = () => {
        const children = this.viewObject.get("children") as Ecore.EObject[]
        return children.map(c=>this.viewFactory.createView(c, this.props).render())
    }
    render = () => {
        return <div>{this.renderChildren()}</div>
    }
}

ViewRegistry.INSTANCE.register(antdFactory)
