package com.epam.rxdemo.server;

import io.vertx.core.VertxOptions;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.rxjava.core.AbstractVerticle;
import io.vertx.rxjava.core.Vertx;
import io.vertx.rxjava.ext.web.Router;
import io.vertx.rxjava.ext.web.handler.StaticHandler;
import io.vertx.rxjava.ext.web.handler.sockjs.SockJSHandler;
import rx.plugins.RxJavaPlugins;

import java.util.Random;

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

        // eventbus client bridge
        BridgeOptions bridgeOptions = new BridgeOptions()
                .addOutboundPermitted(new PermittedOptions().setAddress("feed"));
        router.route("/eventbus/*").handler(SockJSHandler.create(vertx).bridge(bridgeOptions, event -> {
            System.out.println(event.type());
            event.complete(true);
        }));
        // static file server
        router.route().handler(StaticHandler.create().setWebRoot("src/main/webapp").setCachingEnabled(false));

        vertx.createHttpServer().requestHandler(router::accept).listen(8080);

        System.out.println("Server is started");

        Random rng = new Random();
        vertx.setPeriodic(100, t -> vertx.eventBus().publish("feed", rng.nextInt(100)));
    }
}