import * as React from "react";
import {Layout, Menu} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
import {API} from './modules/api'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Redirect, Route, RouteComponentProps, Switch} from "react-router-dom";
import {DataBrowser} from "./components/DataBrowser";
import {QueryRunner} from "./components/QueryRunner";
import {Login} from "./components/Login";
import logo from "./logo.png";

const { Header, Content, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal?: any;
}

export class EcoreApp extends React.Component<any, State> {
    state = {principal: undefined};

    onRightMenu(e : any) {
        if (e.key === "logout") {
            API.instance().logout().then(() => {
                this.setState({principal : undefined});
            })
            this.props.history.push('')
        }
        else if (e.key === "developer") {
            this.props.history.push('/settings/data');
        }
        else if (e.key === "app") {
            this.props.history.push('/app');
        }
    }

    setPrincipal = (principal: any)=>{
        this.setState({principal}, API.instance().init)
    };

    render() {
        return (
            <Layout>
                {this.state.principal === undefined ?
                    <Layout>
                        <Login onLoginSucceed={this.setPrincipal}/>
                    </Layout>
                    :
                    <Layout>
                        {this.renderDev()}
                    </Layout>
                }
            </Layout>
        )
    }

    renderDev() {
        let principal = this.state.principal as any;
        return (
            <Layout style={{height: '100vh'}}>
                <Header style={{height: '40px', padding: "0px"}}>
                    <Menu theme="dark" mode="horizontal" onClick={(e) => this.onRightMenu(e)} style={{float: "right", height: '100%'}}>
                        <Menu.SubMenu title={<span> {principal.name}</span>} style={{float: "right", height: '100%', top: '-3px'}}>
                            <Menu.Item key={'logout'}>Logout</Menu.Item>
                            <Menu.Item key={'developer'}>Developer</Menu.Item>
                            <Menu.Item key={'app'}>App</Menu.Item>
                        </Menu.SubMenu>
                    </Menu>
                </Header>

                <Switch>
                    <Redirect from={'/'} exact={true} to={'/app'}/>
                    <Route path='/app' component={this.renderStartPage}/>
                    <Route path='/settings' component={this.renderSettings}/>
                </Switch>
            </Layout>
        )
    }

    renderSettings=()=>{
        let selectedKeys = ['metadata', 'data', 'query']
            .filter(k => this.props.location.pathname.split('/').includes(k));
        return (
            <Layout>
                <Sider collapsible breakpoint="lg" collapsedWidth="0">
                    <Menu theme="dark" mode="inline" selectedKeys={selectedKeys}>
                        <Menu.Item key={'metadata'}><Link to={`/settings/metadata`}>Metadata</Link></Menu.Item>
                        <Menu.Item key={'data'}><Link to={`/settings/data`}>Data</Link></Menu.Item>
                        <Menu.Item key={'query'}><Link to={`/settings/query`}>Query</Link></Menu.Item>
                    </Menu>
                </Sider>
                <Layout>
                    <Content>
                        <Switch>
                            <Route path='/settings/metadata' component={MetaBrowser}/>
                            <Route exact={true} path='/settings/data' component={DataBrowser}/>
                            <Route path='/settings/data/:id/:ref' component={ResourceEditor}/>
                            <Route path='/settings/query' component={QueryRunner}/>
                        </Switch>
                    </Content>
                </Layout>
            </Layout>
        )
    }

    renderStartPage() {
        return (
            <Layout>
                App
                <img alt="The great and terrible" src={logo} className="logo"/>
            </Layout>
        )
    }
}