import { ThrowStmt } from '@angular/compiler';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Observable, Subscription, Subject, BehaviorSubject,
  ReplaySubject, interval, of
} from 'rxjs';
import { take, map, filter, switchMap, mergeMap, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'rxjs';
  observable$: Observable<number> = new Observable((observer) => {
    observer.next(1);
    observer.next(2);
    observer.next(3);
    // observer.error('Hmmmmm...');
    observer.complete();
  });
  obsSub$: Subscription = new Subscription();
  mySubject$ = new Subject<string>();

  // BehaviorSubject need an initial value
  myBehavior$ = new BehaviorSubject<number>(200);

  // ReplaySubject will save and emit all values in history to new subscribers
  myReplay$ = new ReplaySubject<number>();

  // Take Subscription
  takeSub$: Subscription = new Subscription();

  letters: Observable<string> = of('a', 'b', 'c', 'd', 'e');
  letters$: Subscription = new Subscription();

  searchString = '';
  searchSubject$ = new Subject<string>();
  results$: Observable<any> = new Observable<any>();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    console.log('**** PLAIN OBSERVABLES ****');
    this.obsSub$ = this.observable$.subscribe(
      val => console.log(val),
      err => console.error(err),
      () => console.log('THE END!')
    );

    console.log('**** SUBJECTS ****');
    this.mySubject$.subscribe((val) => console.log('First sub gets', val));
    this.mySubject$.next('First');
    this.mySubject$.next('Second');
  
    // Subjects log only after subscription
    this.mySubject$.subscribe((val) => console.log('Second sub gets', val));
    this.mySubject$.next('Third');

    // BehaviorSubject needs an initial value and emits the most recent value for new subscribers
    console.log('**** BEHAVIOR SUBJECT ****');
    this.myBehavior$.subscribe((val) => console.log('Behav1', val));
    this.myBehavior$.next(300);
    // This subscription will immediately log the val 300
    this.myBehavior$.subscribe((val) => console.log('Behav2', val));

    // ReplaySubject will save and emit all values in history to new subscribers
    console.log('**** REPLAY SUBJECT ****');
    this.myReplay$.next(10000);
    this.myReplay$.next(25000);
    this.myReplay$.subscribe(val => console.log('Replay1', val));
    this.myReplay$.subscribe(val => console.log('Replay2', val));
    this.myReplay$.next(36000);
    this.myReplay$.subscribe(val => console.log('Replay3', val));

    console.log('**** TAKE OPERATOR & SWITCHMAP ****');
    /** For mergeMap, import mergeMap and replace switchMap with it
     * SwitchMap cancels the existing request after it receives a new value from
     * the external observable i.e we only get the letter 'e'
     * Mergemap lets all requests go through
     */
    const numbers$ = interval(1000);
    this.takeSub$ = numbers$
      .pipe(take(5))
      .pipe(filter(x => x % 2 === 0))
      .pipe(map(x => x * 10))
      .subscribe(x => console.log(`From Take ${x}`));

    this.letters$ = this.letters
      .pipe(mergeMap((x) =>
        numbers$
          .pipe(take(5))
          .pipe(map(i => String(i) + x))
      )).subscribe(payload => console.log(payload));

    this.searchSubject$
      .pipe(debounceTime(200))
      .subscribe(x => console.log('Debounced', x));

    this.results$ = this.searchSubject$
      .pipe(debounceTime(200))
      .pipe(distinctUntilChanged())
      .pipe(tap(x => console.log(x)))
      .pipe(switchMap(searchString => this.queryAPI(searchString)));
  }

  inputChanged($event: any): void {
    this.searchSubject$.next($event);
  }

  queryAPI(searchString: string): Observable<any> {
    console.log(`queryAPI string ${searchString}`);
    return this.http.get<any>(`https://www.reddit.com/r/aww/search.json?q=${searchString}`)
      .pipe(map((res: any) => res?.data?.children));
  }

  ngOnDestroy(): void {
    this.obsSub$.unsubscribe();
    this.mySubject$.unsubscribe();
    this.myBehavior$.unsubscribe();
    this.myReplay$.unsubscribe();
    this.takeSub$.unsubscribe();
    this.letters$.unsubscribe();
  }
}
