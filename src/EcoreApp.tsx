import * as React from "react";
import {Layout, Menu} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
//import {API} from './modules/resource'
import {MetaBrowser} from "./components/MetaBrowser";
import {Link, Route, Switch, RouteComponentProps} from "react-router-dom";
import {DataBrowser} from "./components/DataBrowser";

const { Content, Footer, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    
}

export class EcoreApp extends React.Component<any, State> {
    componentDidMount(): void {
        /*
                let id: string = '80e3cf351c5fc42ca3db8be93906e33c';
                Resource.instance().fetchEObject(id, 999).then(eObject => {
                    console.log(eObject.eURI(), eObject.eResource().to());
                    eObject.set('name', eObject.get('name') + '!');
                    return Resource.instance().saveResource(eObject.eResource());
                }).then(resource => {
                    let eObject = resource.get('contents').first()
                    console.log(eObject.eURI(), eObject.eResource().to());
                })
                let classURI = 'ru.neoflex.nfcore.base.auth#//User';
                Resource.instance().findByClass(classURI).then((resources: Ecore.Resource[]) => {
                    resources.forEach(resource=>console.log(resource.to()));
                })
         */
    }

    render() {
        return (
            <Layout>
                <Layout>
                    <Sider collapsible breakpoint="lg" collapsedWidth="0">
                        <Menu theme="dark" mode="inline" selectedKeys={[this.props.location.pathname]} defaultSelectedKeys={['/metadata']}>
                            <Menu.Item key={'/metadata'}><Link to={`/metadata`}>Metadata</Link></Menu.Item>
                            <Menu.Item key={'/data'}><Link to={`/data`}>Data</Link></Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout style={{ height: '100%' }}>
                        <Content>
                            <Switch>
                                <Route path='/metadata' component={MetaBrowser}/>
                                <Route path='/data' component={DataBrowser}/>
                            </Switch>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>Neoflex ©2019</Footer>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}