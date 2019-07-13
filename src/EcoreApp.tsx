import * as React from "react";
import {Layout, Menu} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
//import {API} from './modules/resource'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {NavLink, Route, Switch, RouteComponentProps} from "react-router-dom";
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
                Resource.instance().findByClassURI(classURI).then((resources: Ecore.Resource[]) => {
                    resources.forEach(resource=>console.log(resource.to()));
                })
         */
    }

    render() {
        let selectedKeys = ['metadata', 'data']
            .filter(k=>this.props.location.pathname.split('/').includes(k))
        return (
            <Layout>
                <Layout>
                    <Sider collapsible breakpoint="lg" collapsedWidth="0">
                        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys}>
                            <Menu.Item key={'metadata'}><NavLink to={`/metadata`}>Metadata</NavLink></Menu.Item>
                            <Menu.Item key={'data'}><NavLink to={`/data`}>Data</NavLink></Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout style={{ height: '100%' }}>
                        <Content>
                            <Switch>
                                <Route path='/metadata' component={MetaBrowser}/>
                                <Route exact={true} path='/data' component={DataBrowser}/>
                                <Route path='/data/:id' component={ResourceEditor}/>
                            </Switch>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>Neoflex ©2019</Footer>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}