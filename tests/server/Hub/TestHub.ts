import { HubTemplate } from "@irysius/anguli-components/Hub";
interface ISend {
    timestamp: number;
}
interface IReceive {
    message: string;
}
export let TestHub: HubTemplate<IReceive, ISend> = {
    connect: function (socket) {
        
    },
    sendTypes: {
        timestamp: 0
    },
    receive: {
        message: function (data: string, socket) {
            
        }
    },
    disconnect: function (socket, reason) {

    }
};
export default TestHub;