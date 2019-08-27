import * as React from "react";
import Splitter from './components/CustomSplitter'
import {Tooltip} from "antd";
import {Icon as IconFA} from 'react-fa';
import './MainApp.css'
import {API} from "./modules/api";
import Ecore from "ecore"
import {ViewRegistry} from './ViewRegistry'

const FooterHeight = '2em'

interface State {
    appName: string
    hideReferences: boolean
    currentTool?: string
    application?: Ecore.EObject
}

export class MainApp extends React.Component<any, State> {
    private refSplitterRef: React.RefObject<any> = React.createRef()
    private toolsSplitterRef: React.RefObject<any> = React.createRef()
    private viewFactory = ViewRegistry.INSTANCE.get('antd')

    constructor(props: any) {
        super(props)
        this.state = {appName: props.appName, hideReferences: false, application: undefined}
    }

    componentDidMount(): void {
        API.instance().fetchPackages().then(packages=>{
            const ePackage = packages.find(p=>p.get("nsURI") === "ru.neoflex.nfcore.application");
            if (ePackage) {
                const eClass = ePackage.eContents().find(c=>c.get("name") === "Application") as Ecore.EClass
                API.instance().findByKindAndName(eClass, this.state.appName).then(resources => {
                    if (resources.length > 0) {
                        const application = resources[0].eContents()[0]
                        this.setState({application})
                    }
                })
            }
        })
    }

    renderToolButton=(name: string, label: string, icon: string)=>{
        return <span className={this.state.currentTool === name?"tool-button-selected":"tool-button"} onClick={() => {
            this.setState({currentTool: this.state.currentTool === name ? undefined : name})
        }}><IconFA className="magnify" name={icon}><span style={{paddingLeft: 5}}>{label}</span></IconFA></span>
    }

    renderFooter = () => {
        return (
            <div>
                <Tooltip title={this.state.hideReferences ? "Show" : "Hide"}>
                    <span className="references-button" onClick={() => {
                        this.setState({hideReferences: !this.state.hideReferences})
                    }}><IconFA name="bars"></IconFA></span>
                </Tooltip>
                <div style={{display: "inline-block", alignItems: "center", justifyContent: "center", alignContent: "center"}}>
                    {this.renderToolButton("log", "Log", "ellipsis-v")}
                    {this.renderToolButton("search", "Search", "search")}
                </div>
           </div>
        )
    }

    renderToolbox = () => {
        return this.state.currentTool
    }

    renderContent = () => {
        if (!this.state.application) return null
        return this.viewFactory.createView(this.state.application, this.props)
    }

    renderReferences = () => {
        return "References"
    }

    render = () => {
        return (
            <div style={{flexGrow: 1}}>
                <Splitter
                    minimalizedPrimaryPane={this.state.hideReferences}
                    allowResize={!this.state.hideReferences}
                    ref={this.refSplitterRef}
                    position="vertical"
                    primaryPaneMaxWidth="50%"
                    primaryPaneMinWidth={0}
                    primaryPaneWidth={localStorage.getItem('mainapp_refsplitter_pos') || "40px"}
                    dispatchResize={true}
                    postPoned={false}
                    onDragFinished={() => {
                        const size: string = this.refSplitterRef.current!.panePrimary.props.style.width
                        localStorage.setItem('mainapp_refsplitter_pos', size)
                    }}
                >
                    <div style={{flexGrow: 1}}>
                        {this.renderReferences()}
                    </div>
                    <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                        <div style={{height: `calc(100% - ${FooterHeight})`, width: '100%', overflow: 'hidden'}}>
                            <Splitter
                                ref={this.toolsSplitterRef}
                                position="horizontal"
                                primaryPaneMaxHeight="100%"
                                primaryPaneMinHeight="0%"
                                primaryPaneHeight={localStorage.getItem('mainapp_toolssplitter_pos') || "400px"}
                                dispatchResize={true}
                                postPoned={false}
                                maximizedPrimaryPane={this.state.currentTool === undefined}
                                allowResize={this.state.currentTool !== undefined}
                                onDragFinished={() => {
                                    const size: string = this.toolsSplitterRef.current!.panePrimary.props.style.height
                                    localStorage.setItem('mainapp_toolssplitter_pos', size)
                                }}
                            >
                                <div style={{flexGrow: 1, overflow: 'auto'}}>
                                    {this.renderContent()}
                                </div>
                                <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                                    {this.renderToolbox()}
                                </div>
                            </Splitter>
                        </div>
                        <div style={{height: `${FooterHeight}`}}>
                            {this.renderFooter()}
                        </div>
                    </div>
                </Splitter>
            </div>
        )
    }
}