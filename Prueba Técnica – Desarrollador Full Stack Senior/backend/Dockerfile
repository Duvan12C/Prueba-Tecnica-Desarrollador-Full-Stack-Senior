FROM python:3.12-slim-bookworm

ARG ACCEPT_EULA
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl libgssapi-krb5-2 \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -o /tmp/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA="$ACCEPT_EULA" apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/* /tmp/packages-microsoft-prod.deb

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && chown 10001:10001 /app
COPY app ./app
COPY migrations ./migrations
COPY --chown=10001:10001 tests ./tests
COPY alembic.ini pytest.ini ./
COPY docker/start.py /usr/local/bin/docspace-start.py

USER 10001:10001
EXPOSE 8000
CMD ["python", "/usr/local/bin/docspace-start.py"]
