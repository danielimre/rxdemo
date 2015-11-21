'use strict';
let feedObservable = (function () {
    const obs = Rx.Observable.create(observer => {
            var eb = new EventBus('/eventbus/');
            log('eventbus created');
            eb.onopen = () => {
               log('connection opened');
                eb.registerHandler('feed', function (err, msg) {
                    if (err) {
                        observer.onError(err);
                    } else {
                        observer.onNext(msg.body);
                    }
                });
            };
            return () => {
                eb.close();
                log('connection closed');
            }
        }
    ).publish().refCount();
    return () => obs;
})();

let msgs = feedObservable();
let evens = msgs.filter(x => x % 2 === 0);
let odds = msgs.filter(x => x % 2 === 1);

let allSubscription;
let evenSubscription;
let oddSubscription;
let $log = $('#log');

function appendToObserver($node) {
    return {
        onNext: x => $node.append('<span class="badge badge-info">' + x + '</span>'),
        onError: error,
        onComplete: () => log('stream finished')
    };
}

function log(msg) {
    $log.append('<div class="text-info">' + msg + '</div>');
}

function error(msg) {
    $log.append('<div class="text-danger">' + msg + '</div>');
}

$('#subscribe').click(() => {
    if (!allSubscription) {
        allSubscription = msgs.subscribe(appendToObserver($('#all')));
    }
    if (!evenSubscription) {
        evenSubscription = evens.subscribe(appendToObserver($('#even')))
    }
    if (!oddSubscription) {
        oddSubscription = odds.subscribe(appendToObserver($('#odd')));
    }
});

$('#unsubscribe').click(() => {
    allSubscription.dispose();
    allSubscription = null;
    evenSubscription.dispose();
    evenSubscription = null;
    oddSubscription.dispose();
    oddSubscription = null;
});