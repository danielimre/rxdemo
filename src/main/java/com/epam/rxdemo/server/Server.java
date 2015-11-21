package com.epam.rxdemo.server;

import io.vertx.core.VertxOptions;
import io.vertx.ext.web.handler.sockjs.BridgeEventType;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.rxjava.core.AbstractVerticle;
import io.vertx.rxjava.core.Vertx;
import io.vertx.rxjava.ext.web.Router;
import io.vertx.rxjava.ext.web.handler.StaticHandler;
import io.vertx.rxjava.ext.web.handler.sockjs.SockJSHandler;
import rx.plugins.RxJavaPlugins;

import static io.vertx.rxjava.core.RxHelper.schedulerHook;

/**
 * Simple Vert.x file server.
 *
 * @author Daniel Imre
 */
public class Server extends AbstractVerticle {

    public static void main(String[] args) {
        System.setProperty("vertx.disableFileCaching", "true");
        Vertx vertx = Vertx.vertx(new VertxOptions());
        RxJavaPlugins.getInstance().registerSchedulersHook(schedulerHook(vertx));
        vertx.deployVerticle(Server.class.getName());
    }

    @Override
    public void start() {
        Router router = Router.router(vertx);

        BridgeOptions bridgeOptions = new BridgeOptions()
                .addOutboundPermitted(new PermittedOptions().setAddress("feed"));
        router.route("/eventbus/*").handler(SockJSHandler.create(vertx).bridge(bridgeOptions, event -> {
            if (event.type() == BridgeEventType.SOCKET_CREATED) {
                System.out.println("A socket was created");
            }
            event.complete(true);
        }));
        router.route().handler(StaticHandler.create().setWebRoot("src/main/webapp"));

        vertx.createHttpServer().requestHandler(router::accept).listen(8080);

        System.out.println("Server is started");

        vertx.setPeriodic(1000, t -> vertx.eventBus().publish("feed", "news from the server!"));
    }
}