import { Request, Response, NextFunction } from "express";
import * as asyncLoop from 'node-async-loop';
import * as mongoose from 'mongoose';
import * as fetch from 'node-fetch';
import * as FormData from 'form-data';
import { Resourceschema } from '../model/resource';
import { CustomLogger } from '../config/Logger'
import { camundaService } from '../config/camundaService';
import { Camundadao } from '../dao/Camundadao';
import { DmnWorkerFile } from '../worker/DMNWorker';


import * as path from 'path';
import * as fs from 'fs';

let listofresources = [];
let camundadao = new Camundadao();
const resourcemodel = mongoose.model('resource', Resourceschema);

export class CamundaService {

    private resourcevalue: any;
    private dmnworker = new DmnWorkerFile();

    constructor() { }

    public camundarequest(req: Request, callback): void {
        new CustomLogger().showLogger('info', 'Enter into Camundaservice.ts: camundarequest');
        resourcemodel.find().then((result) => {
            asyncLoop(result, (resource, next) => {
                if (resource.resources === 'home') {
                    this.resourcevalue = resource.resources;
                }
                listofresources.push(resource.resources);
                next();
            }, async (err) => {
                if (err) {
                    return err;
                }
                else {
                    let camundaresponse = await this.camundaauthorization();
                    new CustomLogger().showLogger('info', 'Exit from Camundaservice.ts: camundarequest');
                    callback(camundaresponse);
                }
            })
        }).catch((error) => {
            return error;
        })

    }


    public postscreensservice(screencontent, callback){
        camundadao.postscreens(screencontent,(response)=>{
            callback(response);
        })
    }

    public getallscreensservice(req:Request,callback){
        camundadao.getallscreen(response=>{
            callback(response);
        });
    }


    public camundaauthorization() {
        new CustomLogger().showLogger('info', 'Enter into Camundaservice.ts: camundaauthorization');
        var body = {
            "variables": {
                "resources": { "value": `${this.resourcevalue}`, "type": "String" },
                "resourcetype": { "value": "Screen", "type": "String" }
            }
        }
        const postUrl = `${camundaService.camundaUrl}/engine-rest/engine/default/decision-definition/key/Accesslevel/evaluate`;
        new CustomLogger().showLogger('info', 'Exit from Camundaservice.ts: camundaauthorization');

        return new Promise(resolve => {
            fetch( postUrl, { method: 'POST', body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
            .then((data) => {
                console.log('data---------------->>>', data);
                var responsebody = JSON.stringify(data);
                var finaldata = JSON.parse(responsebody);
                var responsevalue = finaldata[0];
                const test = responsevalue;
                const test2 = JSON.stringify(test);
                // const test3 = JSON.parse(test2);
                // // var data = test3.replace(/(\r\n|\n|\r|\s|n)/gm, '');
                resolve(JSON.parse(test2));
            }).catch(error => {
                resolve(error);
            })
        })
    }

    generateDMN(pageTitles, callback) {
        console.log('REQ=====>>>>>', pageTitles);
        this.dmnworker.dmnTable(pageTitles, async (response) => {
            let dmnresponse = await this.postDMNtoCamunda();
            callback(dmnresponse);
        })
    }

    postDMNtoCamunda() {
        const DmnPath = path.resolve(__dirname, '../../Gep_authorize.dmn');
        const formData = new FormData();
        const postUrl = `${camundaService.camundaUrl}/engine-rest/deployment/create`;
        formData.append("data", fs.createReadStream(DmnPath));
        formData.append("deployment-name", "Gepauthorize");
        formData.append("enable-duplicate-filtering", "true");
        formData.append("deploy-changed-only", "true");
        const options = {
            method: 'POST',
            headers: formData.getHeaders(),
            body: formData
        }
        fetch(postUrl, options).then((response) => {
            response.json().then(data => {
                console.log('data_--------------->', data);
            })
        }).catch(error => {
            console.log('error-----------', error);
        })

    }
}