interface User {
    _id?: Array<{
      $oid: string;
    }>;
    email?: string;
    client_id?: string;
    image?: string;
    name?: string;
    schema?: number;
    profileUrl?:string;
    device_id?: string;
    subscription?:string;
    customer?:string;
  }
  export default User;
  