
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SharedService {

    public DESKTOP_API = 'http://'+window.location.hostname+':8000/desktop';
    public MOBILE_API = '/api/mobile';
}
