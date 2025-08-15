package com.matchpet.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableConfigurationProperties(ExternalAnimalProperties.class)
public class WebClientConfig {

  private final ExternalAnimalProperties props;

  public WebClientConfig(ExternalAnimalProperties props) {
    this.props = props;
  }

  @Bean
  public WebClient animalWebClient() {
    int timeout = props.timeoutMs() != null ? props.timeoutMs() : 5000;

    HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeout)
        .doOnConnected(conn -> conn
            .addHandlerLast(new ReadTimeoutHandler(timeout, TimeUnit.MILLISECONDS))
            .addHandlerLast(new WriteTimeoutHandler(timeout, TimeUnit.MILLISECONDS)));

    return WebClient.builder()
        .baseUrl(props.baseUrl())
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
  }
}
