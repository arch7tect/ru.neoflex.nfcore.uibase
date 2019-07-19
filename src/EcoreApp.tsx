import * as React from "react";
import {Layout, Menu} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
//import {API} from './modules/resource'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Route, RouteComponentProps, Switch} from "react-router-dom";
import {DataBrowser} from "./components/DataBrowser";
import {QueryRunner} from "./components/QueryRunner";
import {Login} from "./components/Login";

const { Content, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal: any|undefined;
}

export class EcoreApp extends React.Component<any, State> {
    state = {principal: undefined}

    setPrincipal = (principal: any)=>{
        this.setState({principal})
    }

    render() {
        return (
            <Layout>
                {this.state.principal === undefined ?
                    <Layout>
                        <Login onLoginSucceed={this.setPrincipal}/>
                    </Layout>
                    :
                    <Layout>
                        {this.renderDef()}
                    </Layout>
                }
            </Layout>
        )
    }

    renderDef() {
        let selectedKeys = ['metadata', 'data', 'query']
            .filter(k => this.props.location.pathname.split('/').includes(k))
        return (
            <Layout>
                <Layout>
                    <Sider collapsible breakpoint="lg" collapsedWidth="0">
                        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys}>
                            <Menu.Item key={'metadata'}><Link to={`/metadata`}>Metadata</Link></Menu.Item>
                            <Menu.Item key={'data'}><Link to={`/data`}>Data</Link></Menu.Item>
                            <Menu.Item key={'query'}><Link to={`/query`}>Query</Link></Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout style={{height: '100vh'}}>
                        <Content>
                            <Switch>
                                <Route path='/metadata' component={MetaBrowser}/>
                                <Route exact={true} path='/data' component={DataBrowser}/>
                                <Route path='/data/:id' component={ResourceEditor}/>
                                <Route path='/query' component={QueryRunner}/>
                            </Switch>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        )
    }
}