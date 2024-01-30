export enum UserDataTypes {
    string = 'string',
    number = 'number',
    boolean = 'boolean',
    select = 'select',
    componentProperty = 'componentProperty',
    nodeProperty = 'nodeProperty',
    forwardRef = 'forwardRef',
}

export type UserTypePrimitive = {
    type: UserDataTypes.string | UserDataTypes.number | UserDataTypes.boolean
    description: string,
    default?: string | number | boolean,
    value?: string | number | boolean,
}

export type UserTypeSelect = {
    type: UserDataTypes.select,
    description: string,
    default?: string,
    value?: string,
    options: Array<{
        value: string,
        label: string,
    }>,
}

export type UserTypeComponentProperty = {
    type: UserDataTypes.componentProperty,
    description: string,
    valueType: ComponentPropertyType,
    default?: never,
    value?: string | number | boolean,
    key: string,
    propertyId: string,
    options?: Array<{
        value: string,
        label: string,
    }>,
}

export type UserType = UserTypePrimitive | UserTypeSelect | UserTypeComponentProperty;