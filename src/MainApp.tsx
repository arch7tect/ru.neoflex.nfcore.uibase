import * as React from "react";
import Splitter from './components/CustomSplitter'
import {Tooltip} from "antd";
import {Icon as IconFA} from 'react-fa';
import './MainApp.css'
import {API} from "./modules/api";
import Ecore from "ecore"
import {ViewRegistry} from './ViewRegistry'
import { Tree } from 'antd'

const FooterHeight = '2em'

interface State {
    appName: string
    hideReferences: boolean
    currentTool?: string
    application?: Ecore.EObject
    viewObject?: Ecore.EObject
    referenceTree?: Ecore.EObject
    path?: Ecore.EObject[]
}

export class MainApp extends React.Component<any, State> {
    private refSplitterRef: React.RefObject<any> = React.createRef()
    private toolsSplitterRef: React.RefObject<any> = React.createRef()
    private viewFactory = ViewRegistry.INSTANCE.get('antd')

    constructor(props: any) {
        super(props)
        this.state = {appName: props.appName, hideReferences: false, application: undefined}
    }

    setViewObject = (viewObject: Ecore.EObject)=>{
        this.setState({viewObject})
        API.instance().call(viewObject.eURI(), "generateReferenceTree", []).then(referenceTree=>{
            if (!!referenceTree) {
                API.instance().loadEObjectWithRefs(999, referenceTree, Ecore.ResourceSet.create(), {}, viewObject.eURI() + referenceTree._id).then(r=>{
                    this.setState(({referenceTree: r.eContents()[0]}))
                })
            }
        })
    }

    componentDidMount(): void {
        API.instance().fetchPackages().then(packages=>{
            const ePackage = packages.find(p=>p.get("nsURI") === "ru.neoflex.nfcore.application");
            if (ePackage) {
                const eClass = ePackage.eContents().find(c=>c.get("name") === "Application") as Ecore.EClass
                API.instance().findByKindAndName(eClass, this.state.appName).then(resources => {
                    if (resources.length > 0) {
                        const application = resources[0].eContents()[0]
                        this.setState({application}, ()=>{this.setViewObject(application)})
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
        if (!this.state.viewObject) return null
        return this.viewFactory.createView(this.state.viewObject, this.props)
    }

    renderReferences = () => {
        const referenceTree = this.state.referenceTree
        return !referenceTree ? null : (
            <Tree.DirectoryTree defaultExpandAll>
                {referenceTree.get('children').map((c: Ecore.EObject)=>this.renderTreeNode(c))}
            </Tree.DirectoryTree>

        )
    }

    renderTreeNode = (eObject: Ecore.EObject, parentKey?: string) => {
        const code = eObject.get('name')
        const key = parentKey ? parentKey + '.' + code : code
        const children = eObject.get('children').map((c: Ecore.EObject)=>this.renderTreeNode(c, key))
        const isLeaf = !eObject.isKindOf('CatalogNode')
        return <Tree.TreeNode title={code} key={key} isLeaf={isLeaf}>{children}</Tree.TreeNode>
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
                    <div style={{flexGrow: 1, backgroundColor: "white", height: '100%', overflow: "auto"}}>
                        {this.renderReferences()}
                    </div>
                    <div style={{backgroundColor: "white", height: '100%', overflow: 'auto'}}>
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
                                <div style={{zIndex: 10, backgroundColor: "white"}}>
                                    <div style={{height: '100%', width: '100%', backgroundColor: "white"}}>{this.renderContent()}</div>
                                </div>
                                <div style={{height: '100%', width: '100%', overflow: 'auto', backgroundColor: "white"}}>
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