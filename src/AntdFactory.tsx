
import {ViewFactory, ViewContainer, View} from './ViewRegistry'
import Ecore from "ecore";

class AntdFactory implements ViewFactory {
    name = 'antd'
    createView = (viewObject: Ecore.EObject, props: any) => {
        let view;
        if (viewObject.isKindOf("ViewContainer")) {
            view = new ViewContainer(props)
        }
        else {
            view = new View(props)
        }
        view.setViewObject(viewObject)
        view.setViewFactory(this)
        return view
    }
}

export default new AntdFactory()
