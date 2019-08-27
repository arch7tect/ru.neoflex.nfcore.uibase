import * as React from "react";
import {Suspense} from "react";
import {Button, Icon, Layout, Menu, notification} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
import {API, Error, IErrorHandler} from './modules/api'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Redirect, Route, RouteComponentProps, Switch} from "react-router-dom";
import {QueryRunner} from "./components/QueryRunner";
import Login from "./components/Login";
import {DataBrowser} from "./components/DataBrowser";
import {MainApp} from "./MainApp";
import {withTranslation} from "react-i18next";
import Ecore, {EObject} from "ecore";

const MetaBrowserNew = withTranslation()(MetaBrowser);
const { Header, Content, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal?: any;
    appName: string;
    languages: string[];
    selectLanguage: string;
}

export class EcoreApp extends React.Component<any, State> {

    constructor(props: any) {
        super(props);
        this.state = {principal: undefined, appName: props.appName, languages: [], selectLanguage: ''};
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

    getLanguages() {
        const prepared: Array<string> = [];
        API.instance().fetchAllClasses(false).then(classes => {
            const temp = classes.find((c: EObject) => c._id === "//Lang");
            API.instance().findByKindAndRegexp(temp as Ecore.EClass, "")
                .then((resources) => {
                    resources.forEach((res: Ecore.Resource) => {
                        if (res.to().length === undefined) {
                            const row = {...res.to(), resource: res};
                            if (row.hasOwnProperty("children")) {
                                row["_children"] = row["children"];
                                delete row["children"]
                            }
                            prepared.push(row.name);
                        }
                    });
                    this.setState({languages: prepared})
                })
        });
    }

    componentDidMount(): void {
        const _this = this;
        let errorHandler : IErrorHandler = {
            handleError(error: Error): void {
                if (error.status === 401) {
                    _this.setState({principal: undefined});
                }
                let btn = (<Button type="link" size="small" onClick={() => notification.destroy()}>
                    Close All
                </Button>);
                let key = error.error + error.status + error.message;
                    notification.error({
                        message: "Error: " + error.status + " (" + error.error + ")",
                        btn,
                        duration: 0,
                        description: error.message,
                        key
                    })
            }
        } as IErrorHandler;
        API.instance().addErrorHandler(errorHandler);
    };

    render = () => {
        if (!this.state.languages.length) {this.getLanguages()}
        return (
                <Layout>
                    {this.state.principal === undefined ?
                        <Layout>
                            <Suspense fallback={<div className="loader"/>}>
                                <Login onLoginSucceed={this.setPrincipal}/>
                            </Suspense>
                        </Layout>
                        :
                        <Layout>
                            <Suspense fallback={<div className="loader"/>}>
                                {this.renderDev()}
                            </Suspense>
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
                            <Menu.SubMenu  title={<span><Icon type="global" style={{fontSize: '17px'}}/>Language</span>}>
                                {
                                    this.state.languages.map((c: any) =>
                                        <Menu.Item key={c} onClick={() => this.setState({selectLanguage: c})}>
                                            <Icon type="flag" style={{fontSize: '17px'}}/>
                                            {c.toUpperCase()}
                                        </Menu.Item>)
                                }
                            </Menu.SubMenu>
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
                            <Route path='/settings/metadata' component={MetaBrowserNew}/>
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
            <MainApp {...this.props}/>
        )
    }
}
