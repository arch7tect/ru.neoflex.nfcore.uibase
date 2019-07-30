/// <reference types="ecore" />

export namespace Ecore {
    export interface Edit {
        childTypes: (object, createDescriptor)=>Array<EObject>;
        siblingTypes: siblingTypes;
        childDescriptors: childDescriptors;
        siblingDescriptors: siblingDescriptors;
        choiceOfValues: choiceOfValues;
    }
    export interface EObject {
        setEClass: (eClass: EClass)=>void;
        create: (attributes: any)=>EObject;
        has: (name: string)=>boolean;
        isSet: (name: string)=>boolean;
        set: (attrs: any, options: any)=>EObject;
        unset: (attrs: any, options: any)=>EObject;
        get: (feature: string)=>any;
        getEObject: (uri: string)=>EObject;
        isTypeOf: (type: string|EObject)=>any;
        isKindOf: (type: string|EObject)=>any;
        eResource: ()=>Resource;
        eContent: ()=>Array;
        eURI: ()=>string;
        fragment: ()=>string;
        eClass: EClass;
        eContents: ()=>Array<EObject>;
        eContainer: EObject;
        _id: string;
    }
    export interface EList extends Array<EObject> {
        add: (eObject: EObject)=>EList;
        addAll: (arguments: Array<EObject>|EObject)=>EList;
        remove: (eObject: EObject)=>EList;
        clear: ()=>EList;
        size: ()=>number;
        at: (position: number)=>EObject;
        array: ()=>Array<EObject>;
        first: ()=>EObject;
        last: ()=>EObject;
        rest: (position: number)=>Array<EObject>;
        each: (iterator: (value: any, key: any, list: EList)=>void, context?: any)=>void;
        filter: (iterator: (value: any, key: any, list: EList)=>boolean, context?: any)=>Array<EObject>;
        map: (iterator: (value: any, key: any, list: EList)=>any, context?: any)=>Array<any>;
        reject: (iterator: (value: any, key: any, list: EList)=>boolean, context?: any)=>Array<EObject>;
        contains: (eObject: EObject)=>boolean;
        indexOf: (eObject: EObject)=>number;
    }
    export interface EString extends EObject {
    }
    export interface EInt extends EObject {
    }
    export interface EBoolean extends EObject {
    }
    export interface EDouble extends EObject {
    }
    export interface EDate extends EObject {
    }
    export interface EIntegerObject extends EObject {
    }
    export interface EFloatObject extends EObject {
    }
    export interface ELongObject extends EObject {
    }
    export interface EMap extends EObject {
    }
    export interface EDiagnosticChain extends EObject {
    }
    export interface JSObject extends EObject {
    }
    export interface EModelElement extends EObject {
    }
    export interface EAnnotation extends EModelElement {
    }
    export interface ENamedElement extends EModelElement {
    }
    export interface EPackage extends ENamedElement {

    }
    export interface EClassifier extends  ENamedElement {
    }
    export interface EClass extends EClassifier {
        getEStructuralFeature: (feature: string|EObject)=>any;
    }
    export interface EDataType extends EClassifier {
    }
    export interface ETypedElement extends ENamedElement {
    }
    export interface EStructuralFeature extends ETypedElement {
    }
    export interface EAttribute extends EStructuralFeature {
    }
    export interface EReference extends EStructuralFeature {
    }
    export interface EOperation extends ETypedElement {
    }
    export interface EParameter extends ETypedElement {
    }
    export interface EEnum extends EDataType {
    }
    export interface EEnumLiteral extends ENamedElement {
    }
    export interface EGenericType extends EObject {
    }
    export interface ETypeParameter extends ENamedElement {
    }
    export interface Resource extends EObject {
        rev: string;
        load: (any)=>void;
        to: ()=>any;
    }
    export interface EPackage extends EObject{
    }
    export interface EPackageRegistry extends EObject {
        register: (ePackage: EPackage)=>void;
        ePackages: ()=>EPackage[];
    }
    export interface ResourceSet extends EObject {
        create: (uri: any)=>Resource;
        getEObject: (uri: string)=>EObject;
        elements: (type?: string|EClass)=>EObject[];
        toJSON: ()=>any;
    }

    export namespace EPackage {
        const Registry: Ecore.EPackageRegistry;
    }
    export namespace ResourceSet {
        function create(): Ecore.ResourceSet;
    }
}

