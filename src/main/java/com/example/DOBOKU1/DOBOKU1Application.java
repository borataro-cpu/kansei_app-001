package com.example.DOBOKU1;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@SpringBootApplication
public class DOBOKU1Application {

	private static final Logger logger = LoggerFactory.getLogger(DOBOKU1Application.class);

	public static void main(String[] args) {
		SpringApplication.run(DOBOKU1Application.class, args);
	}

	@PostConstruct
	public void onStart() {
		logger.info("DOBOTORE アプリケーションが正常に起動しました。");
	}

	@PreDestroy
	public void onExit() {
		logger.info("DOBOTORE アプリケーションが終了します。");
		copyLogToNetworkDrive();
	}

	private void copyLogToNetworkDrive() {
		try {
			// 今日の日付を取得 (YYMMDD形式)
			String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
			String fileName = today + "_O_002_0005_DOBOTORE.log";

			// コピー元（ローカル）
			File source = new File("logs/O_002_0005_DOBOTORE_log/" + fileName);
			// コピー先（社内サーバー）
			File dest = new File("\\\\Osaka-tecws\\OsakaTech\\開発担当\\log\\O_002_0005_DOBOTORE_log\\" + fileName);

			if (source.exists()) {
				// フォルダがなければ作成
				if (!dest.getParentFile().exists()) {
					dest.getParentFile().mkdirs();
				}
				// 上書きコピーを実行
				Files.copy(source.toPath(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
				logger.info("ログを社内サーバーへバックアップしました。");
			}
		} catch (Exception e) {
			logger.error("ログのコピーに失敗しました: " + e.getMessage());
		}
	}
}

