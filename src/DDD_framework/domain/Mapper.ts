/* 
    Interface: Mapper
        Functions:
            - toDomainModel: Persistence Object to DomainModel
            - toDPO: DomainModel to Persistence Object
            - toDTO?: DomainModel to Transport Object
            - toDTOs?: DomainModels to Transport Objects
            - toDomainModels?: Persistence Objects to DomainModels
            - toModifierDPO?: DomainModel Modifier Object to Persistence Modifier Object
*/
export interface Mapper<DomainModel> {
    toDomainModel(raw: any): DomainModel;
    toDPO(domainModel: DomainModel, ...params: any): any;

    toDTO?(domainModel: DomainModel): any;
    toDTOs?(domainModels: DomainModel[]): any[];
    toDomainModels?(raws: any[]): DomainModel[];

    /* This is a optional function for mapper, suggest to use save in repo when you want to update model data. */
    toModifierDPO?(domainModel: DomainModel, ...params: any): any;
}
