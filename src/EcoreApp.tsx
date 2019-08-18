import * as React from "react";
import {Icon, Layout, Menu, notification} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
import {API, Error, IErrorHandler} from './modules/api'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Redirect, Route, RouteComponentProps, Switch} from "react-router-dom";
import {QueryRunner} from "./components/QueryRunner";
import {Login} from "./components/Login";
import {DataBrowser} from "./components/DataBrowser";
import {MainApp} from "./MainApp";

const { Header, Content, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal?: any;
    appName: string;
}

export class EcoreApp extends React.Component<any, State> {

    constructor(props: any) {
        super(props);
        this.state = {principal: undefined, appName: props.appName};
    }

    onRightMenu(e : any) {
        if (e.key === "logout") {
            API.instance().logout().then(() => {
                this.setState({principal : undefined});
            });
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

    componentDidMount(): void {
        let keyAll: Array<string> = [];
        let errorHandler : IErrorHandler = {
            handleError: function (error: Error): void {
                let key = error.error + error.status + error.message;
                keyAll.push(key);
                    notification.error({
                        message: "Error: " + error.status + " (" + error.error + ")",
                        duration: 0,
                        description: error.message,
                        key,
                        onClose: () => {
                            for (let key of keyAll) {
                                notification.close(key)
                            }
                        }
                    })
            }
        } as IErrorHandler;
        API.instance().addErrorHandler(errorHandler);
    };

    render = () => {
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
    };

    renderDev = () => {
        let principal = this.state.principal as any;
        return (
            <Layout style={{height: '100vh'}}>
                <Header style={{height: '40px', padding: "0px"}}>
                    <Menu theme="dark" mode="horizontal" onClick={(e) => this.onRightMenu(e)} style={{float: "right", height: '100%'}}>
                        <Menu.SubMenu title={<span><Icon type="user" style={{fontSize: '17px', marginRight: '0'}}/> {principal.name}</span>} style={{float: "right", height: '100%', top: '-3px'}}>
                            <Menu.Item key={'logout'}><Icon type="logout" style={{fontSize: '17px'}}/>Logout</Menu.Item>
                            <Menu.Item key={'developer'}><Icon type="setting" style={{fontSize: '17px'}} theme="filled"/>Developer</Menu.Item>
                            <Menu.Item key={'app'}><Icon type="sketch" style={{fontSize: '17px'}}/>App</Menu.Item>
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
    };

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
    };

    renderStartPage = ()=>{
        return (
            <MainApp {...this.props}></MainApp>
        )
    }
}