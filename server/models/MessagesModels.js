import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Users",
    required:true,
    },
    recipient:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Users",
        required:false, /*le message ne peut pas avoir de recipient au cas ou il s'envoie les message à lui même*/
        },
        messageType:{
            type:String,
            enum:["text", "file"],
            required:true,
        },
        content:{
            type:String,
            required:function(){
                return this.messageType === "text";
            },
        },
        fileUrl:{
            type:String,
            required:function(){
                return this.messageType === "file";
            },
        },
        timestamp:{
            type : Date,
            default:Date.now,
        },
});

const Message = mongoose.model("Messages", messageSchema);

export default Message;
