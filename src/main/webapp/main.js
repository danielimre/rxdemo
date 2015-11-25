'use strict';
var failMe = false;
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

let msgs = feedObservable().map(x => {
    if (failMe) {
        failMe = false;
        throw new Error("Aaaarghh");
    }
    return x;
}).doOnError(e => error(e));
let evens = msgs.filter(x => x % 2 === 0).onErrorResumeNext(Rx.Observable.just(-1));
let odds = msgs.filter(x => x % 2 === 1).retry();

let allSubscription;
let evenSubscription;
let oddSubscription;
let $log = $('#log');

function appendToObserver($node) {
    return {
        onNext: x => {
            let c = x % 2 ? 'salmon' : 'cornflowerblue';
            $node.append('<span class="badge" style="background-color: ' + c + '">' + x + '</span>')
        },
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

$('#subscribeall').click(() => {
    if (!allSubscription) {
        allSubscription = msgs.subscribe(appendToObserver($('#all')));
    }
});
$('#subscribeeven').click(() => {
    if (!evenSubscription) {
        evenSubscription = evens.subscribe(appendToObserver($('#even')))
    }
});
$('#subscribeodd').click(() => {
    if (!oddSubscription) {
        oddSubscription = odds.subscribe(appendToObserver($('#odd')));
    }
});
$('#unsubscribeall').click(() => {
    if (allSubscription) {
        allSubscription.dispose();
        allSubscription = null;
    }
});
$('#unsubscribeeven').click(() => {
    if (evenSubscription) {
        evenSubscription.dispose();
        evenSubscription = null;
    }
});
$('#unsubscribeodd').click(() => {
    if (oddSubscription) {
        oddSubscription.dispose();
        oddSubscription = null;
    }
});

$('#failure').click(() => failMe = !failMe);