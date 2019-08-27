import * as React from "react";
import Ecore from "ecore";

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
        return <span>{this.viewObject.eClass.eURI()}</span>
    }
}

export interface ViewFactory {
    createView(viewObject: Ecore.EObject, props: any): View;
    name: string;
}

