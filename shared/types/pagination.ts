export interface Pagination {

 page:number

 limit:number

}


export interface PaginatedResult<T>{

 data:T[]

 page:number

 limit:number

 total:number

 totalPages:number

}