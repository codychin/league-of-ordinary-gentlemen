export class PostgresBudget {
 constructor(db,room){this.db=db;this.room=room;}
 async action(action,id,amount=null){const {data,error}=await this.db.rpc('brief_voice_room',{p_action:action,p_room:this.room,p_turn:this.turn||null,p_operation:id,p_amount:amount});if(error)throw Error('Budget reservation unavailable');return data;}
 reserve(id,amount){return this.action('reserve',id,amount);}
 start(id){return this.action('start',id);}
}
export async function guardedProviderCall({enabled,privateAccessVerified,quote,operation,budget,id,signal}){
 if(!enabled||!privateAccessVerified)throw Error('Paid execution disabled');
 if(!quote?.verified||!Number.isSafeInteger(quote.maximumMicroUSD)||quote.maximumMicroUSD<=0||!Number.isFinite(quote.expiresAt)||Date.now()>=quote.expiresAt)throw Error('Current verified worst-case quote required');
 signal?.throwIfAborted();await budget.reserve(id,quote.maximumMicroUSD);signal?.throwIfAborted();await budget.start(id);signal?.throwIfAborted();return operation(signal);
}
